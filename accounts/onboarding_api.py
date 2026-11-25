import os
import secrets

import requests
from datetime import timedelta
from uuid import UUID

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from accounts.middleware import active_impersonation
from accounts.models import AgencyExpert, AgencyProfile, ExpertProfile, OfficePayment, OfficeSubscription, RoleApplication, User
from panel.models import AgencyExpertLink, PropertyRecord
from panel.serializers import AgencyProfileSerializer
from panel.settings_api import is_superadmin
from panel.settings_models import PanelSettings

# Introductory monthly prices in toman.
PLANS = dict(zip(OfficeSubscription.Tier.values, [(0, 0), (299_000, 3), (499_000, 10), (699_000, 25), (999_000, 50)]))
TERMS = "اطلاعات دفتر و مدارک باید صحیح باشند. اشتراک پولی پس از تأیید پرداخت فعال می‌شود. با پایان اعتبار، امکانات پایه باقی می‌ماند و امکانات پولی تا تمدید غیرفعال می‌شود."


class ResumeSerializer(serializers.Serializer):
    job_title = serializers.CharField(max_length=150)
    specialties = serializers.ListField(child=serializers.CharField(max_length=100), max_length=15, allow_empty=False)
    experience_years = serializers.IntegerField(min_value=0, max_value=80)
    job_details = serializers.CharField(max_length=4000)


class OfficeApplicationSerializer(AgencyProfileSerializer):
    class Meta(AgencyProfileSerializer.Meta):
        fields = ['agency_name', 'occupancy_type', 'lease_end_date', 'logo', 'has_business_license',
                  'license_number', 'license_expires_at', 'license_image', 'landline', 'office_address',
                  'office_district', 'office_neighborhood', 'description']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        for field in ('landline', 'logo', 'office_district', 'office_neighborhood'):
            if not attrs.get(field, getattr(self.instance, field, None)):
                raise ValidationError({field: 'این فیلد الزامی است.'})
        if attrs.get('has_business_license'):
            for field in ('license_number', 'license_expires_at', 'license_image'):
                if not attrs.get(field, getattr(self.instance, field, None)):
                    raise ValidationError({field: 'اطلاعات پروانه را کامل وارد کنید.'})
        return attrs


def active_offices():
    return User.objects.filter(role=User.Role.AGENCY, is_active=True, account_status=User.AccountStatus.ACTIVE)


def find_office(code):
    try:
        key = UUID(str(code))
    except (ValueError, TypeError):
        raise NotFound('کد دفتر معتبر نیست.')
    office = active_offices().filter(office_subscription__code=key, agency_profile__isnull=False).select_related('agency_profile').first()
    if not office:
        raise NotFound('دفتر فعالی با این کد پیدا نشد.')
    return office


def office_info(office, request):
    profile = office.agency_profile
    experts = AgencyExpertLink.objects.filter(agency=office, expert__role=User.Role.EXPERT,
                                             expert__is_active=True, expert__account_status=User.AccountStatus.ACTIVE)
    return {'name': profile.agency_name, 'logo': request.build_absolute_uri(profile.logo.url) if profile.logo else None,
            'address': profile.office_address, 'active_experts': experts.count()}


def application_data(row, request):
    result = {'id': row.id, 'kind': row.kind, 'status': row.status, 'tier': row.tier, 'details': row.details,
              'created_at': row.created_at, 'reviewed_at': row.reviewed_at, 'terms_accepted_at': row.terms_accepted_at,
              'name': row.applicant.full_name, 'phone': row.applicant.phone}
    if row.office_id and hasattr(row.office, 'agency_profile'):
        result['office_name'] = row.office.agency_profile.agency_name
    if row.kind == 'office' and row.status == 'pending' and hasattr(row.applicant, 'agency_profile'):
        result['profile'] = OfficeApplicationSerializer(row.applicant.agency_profile, context={'request': request}).data
    return result


class OfficeLookup(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != User.Role.USER:
            raise PermissionDenied()
        return Response(office_info(find_office(request.query_params.get('code')), request))


class Applications(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_active or user.account_status != User.AccountStatus.ACTIVE:
            raise PermissionDenied()
        records = RoleApplication.objects.select_related('applicant__agency_profile', 'office__agency_profile')
        incoming = records.none()
        subscription = None
        if is_superadmin(user):
            incoming = records.exclude(kind='expert')
        elif user.role == User.Role.AGENCY:
            incoming = records.filter(kind='expert', office=user)
            sub, _ = OfficeSubscription.objects.get_or_create(office=user)
            subscription = {'code': sub.code, 'tier': sub.tier, 'active_tier': sub.active_tier, 'paid_until': sub.paid_until,
                            'promoted_files': list(sub.promoted_files.values_list('id', flat=True)),
                            'ai_available': bool(os.environ.get('OPENAI_API_KEY') and os.environ.get('MLKINO_AD_COPY_MODEL'))}
        return Response({
            'own': [application_data(row, request) for row in records.filter(applicant=user)[:30]],
            'incoming': [application_data(row, request) for row in incoming.filter(status='pending')[:100]],
            'subscription': subscription,
            'plans': [{'id': key, 'label': label, 'price': PLANS[key][0], 'promotions': PLANS[key][1]}
                      for key, label in OfficeSubscription.Tier.choices],
            'terms': TERMS,
            'demo_gateway': gateway_options(),
        })

    @transaction.atomic
    def post(self, request):
        if active_impersonation(request):
            raise PermissionDenied()
        user = User.objects.select_for_update().get(pk=request.user.pk)
        if not user.is_active or user.account_status != User.AccountStatus.ACTIVE or user.registration_required:
            raise PermissionDenied('ابتدا پروفایل و احراز هویت خود را کامل کنید.')
        kind = request.data.get('kind')
        required_role = {'expert': User.Role.USER, 'office': User.Role.USER, 'upgrade': User.Role.AGENCY}
        if not isinstance(kind, str) or required_role.get(kind) != user.role:
            raise PermissionDenied()
        if RoleApplication.objects.filter(applicant=user, status='pending').exists():
            raise ValidationError('درخواست دیگری در انتظار بررسی است.')
        application = RoleApplication(applicant=user, kind=kind)
        if kind == 'expert':
            if request.data.get('confirm_office') is not True:
                raise ValidationError('ابتدا دفتر انتخاب‌شده را تأیید کنید.')
            application.office = find_office(request.data.get('code'))
            resume = ResumeSerializer(data=request.data)
            resume.is_valid(raise_exception=True)
            application.details = dict(resume.validated_data)
        else:
            tier = request.data.get('tier')
            if not isinstance(tier, str) or tier not in PLANS or (kind == 'upgrade' and tier == 'free'):
                raise ValidationError('پلن معتبر انتخاب کنید.')
            if request.data.get('accept_terms') not in (True, 'true'):
                raise ValidationError('تأیید قوانین لازم است.')
            application.tier = tier
            application.terms_accepted_at = timezone.now()
            application.details = {'terms': TERMS, 'monthly_price': PLANS[tier][0]}
            if kind == 'office':
                profile = AgencyProfile.objects.filter(manager=user).first()
                serializer = OfficeApplicationSerializer(profile, data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save(manager=user)
        application.save()
        return Response(application_data(application, request), status=201)


class ApplicationDecision(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        if active_impersonation(request):
            raise PermissionDenied()
        row = RoleApplication.objects.select_for_update().filter(pk=pk).first()
        reviewer = request.user
        if not row:
            raise NotFound()
        if row.kind == 'expert':
            allowed = row.office_id == reviewer.pk and active_offices().filter(pk=reviewer.pk).exists()
        else:
            allowed = is_superadmin(reviewer)
        if not allowed or row.applicant_id == reviewer.pk:
            raise NotFound()
        if row.status != 'pending':
            raise ValidationError('این درخواست قبلاً بررسی شده است.')
        decision = request.data.get('decision')
        if decision not in ('approve', 'reject'):
            raise ValidationError('نتیجه بررسی را تعیین کنید.')
        applicant = User.objects.select_for_update().get(pk=row.applicant_id)
        now = timezone.now()
        if decision == 'approve':
            required_role = User.Role.AGENCY if row.kind == 'upgrade' else User.Role.USER
            if applicant.role != required_role or not applicant.is_active or applicant.account_status != User.AccountStatus.ACTIVE:
                raise ValidationError('وضعیت حساب متقاضی تغییر کرده است.')
            if row.kind == 'expert':
                applicant.role = User.Role.EXPERT
                applicant.save(update_fields=['role'])
                ExpertProfile.objects.update_or_create(user=applicant, defaults=row.details)
                AgencyExpert.objects.update_or_create(expert=applicant, defaults={'agency_id': row.office_id, 'is_active': True})
                AgencyExpertLink.objects.filter(expert=applicant).exclude(agency_id=row.office_id).delete()
                AgencyExpertLink.objects.get_or_create(expert=applicant, agency_id=row.office_id)
            else:
                subscription, _ = OfficeSubscription.objects.select_for_update().get_or_create(office=applicant)
                if row.tier != 'free':
                    reference = request.data.get('payment_reference')
                    if not isinstance(reference, str) or not 1 <= len(reference.strip()) <= 100:
                        raise ValidationError('شناسه پرداخت تأییدشده را وارد کنید.')
                    reference = reference.strip()
                    if reference.upper().startswith('DEMO-'):
                        raise ValidationError('شناسه آزمایشی برای پرداخت واقعی معتبر نیست.')
                    if PLANS[row.tier][1] < PLANS[subscription.active_tier][1]:
                        raise ValidationError('در زمان اعتبار اشتراک، پلن فعلی یا پلن بالاتر را انتخاب کنید.')
                    subscription.tier = row.tier
                    subscription.paid_until = max(now, subscription.paid_until or now) + timedelta(days=30)
                    payment, created = OfficePayment.objects.get_or_create(reference=reference, defaults={
                        'subscription': subscription, 'application': row, 'paid_until': subscription.paid_until,
                        'amount': row.details['monthly_price'],
                    })
                    if not created:
                        raise ValidationError('این شناسه پرداخت قبلاً ثبت شده است.')
                    subscription.save(update_fields=['tier', 'paid_until'])
                    keep = list(subscription.promoted_files.filter(office=applicant, publication_state='published',
                                archived_at=None).order_by('-id').values_list('pk', flat=True)[:PLANS[row.tier][1]])
                    subscription.promoted_files.set(keep)
                if row.kind == 'office':
                    applicant.role = User.Role.AGENCY
                    applicant.save(update_fields=['role'])
        row.status = 'approved' if decision == 'approve' else 'rejected'
        row.reviewer = reviewer
        row.reviewed_at = now
        row.save(update_fields=['status', 'reviewer', 'reviewed_at'])
        return Response(application_data(row, request))


class OfficePromotions(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not active_offices().filter(pk=request.user.pk).exists():
            raise PermissionDenied()
        files = PropertyRecord.objects.filter(office=request.user, kind='file', publication_state='published', archived_at=None)
        return Response([{'id': row.pk, 'title': row.data.get('title') or str(row.pk)} for row in files[:200]])

    @transaction.atomic
    def post(self, request):
        if active_impersonation(request):
            raise PermissionDenied()
        if not active_offices().filter(pk=request.user.pk).exists():
            raise PermissionDenied()
        sub = OfficeSubscription.objects.select_for_update().filter(office=request.user).first()
        if not sub or sub.active_tier == 'free':
            raise PermissionDenied('برای تبلیغ فایل، اشتراک فعال لازم است.')
        file_id = serializers.IntegerField(min_value=1).run_validation(request.data.get('file_id'))
        row = PropertyRecord.objects.filter(office=request.user, kind='file', publication_state='published', archived_at=None, pk=file_id).first()
        if not row:
            raise NotFound()
        if sub.promoted_files.filter(pk=row.pk).exists():
            sub.promoted_files.remove(row)
        else:
            if sub.promoted_files.filter(office=request.user, publication_state='published', archived_at=None).count() >= PLANS[sub.active_tier][1]:
                raise ValidationError('سقف فایل‌های ویژهٔ پلن پر شده است.')
            sub.promoted_files.add(row)
        return Response({'promoted_files': list(sub.promoted_files.values_list('id', flat=True))})


class DiamondCopyThrottle(UserRateThrottle):
    rate = '10/day'
    scope = 'diamond-ad-copy'


class DiamondAdCopy(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [DiamondCopyThrottle]

    def post(self, request):
        if active_impersonation(request):
            raise PermissionDenied()
        subscription = OfficeSubscription.objects.filter(office=request.user).first()
        if (not subscription or subscription.active_tier != 'diamond'
                or not active_offices().filter(pk=request.user.pk).exists()):
            raise PermissionDenied('این بخش به اشتراک فعال الماس نیاز دارد.')
        key, model = os.environ.get('OPENAI_API_KEY'), os.environ.get('MLKINO_AD_COPY_MODEL')
        if not key or not model:
            return Response({'detail': 'سرویس هوش مصنوعی هنوز پیکربندی نشده است.'}, status=503)
        facts = serializers.CharField(max_length=1500).run_validation(request.data.get('facts'))
        try:
            result = requests.post(
                'https://api.openai.com/v1/chat/completions',
                headers={'Authorization': 'Bearer ' + key},
                json={'model': model, 'max_completion_tokens': 600, 'messages': [
                    {'role': 'system', 'content': 'برای آگهی ملک متن فارسی کوتاه بنویس. فقط از مشخصات داده‌شده استفاده کن و اطلاعات دیگری نساز.'},
                    {'role': 'user', 'content': facts},
                ]},
                timeout=(4, 10),
            )
            result.raise_for_status()
            copy = result.json()['choices'][0]['message']['content']
            if not isinstance(copy, str) or not copy.strip():
                raise ValueError
        except (requests.RequestException, ValueError, IndexError, KeyError, TypeError):
            return Response({'detail': 'متن آگهی آماده نشد. دوباره تلاش کنید.'}, status=502)
        return Response({'copy': copy[:4000]})


class GatewayOptions(serializers.Serializer):
    enabled = serializers.BooleanField()
    title = serializers.CharField(max_length=60)
    default_result = serializers.ChoiceField(choices=['success', 'failure', 'cancelled'])


GATEWAY_DEFAULTS = {'enabled': True, 'title': 'درگاه آزمایشی ملکینو', 'default_result': 'success'}


def gateway_options():
    stored = PanelSettings.objects.filter(pk=1).values_list('data', flat=True).first() or {}
    return {**GATEWAY_DEFAULTS, **stored.get('demo_gateway', {})}


class GatewaySettings(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_superadmin(request.user):
            raise PermissionDenied()
        return Response(gateway_options())

    @transaction.atomic
    def put(self, request):
        if not is_superadmin(request.user) or active_impersonation(request):
            raise PermissionDenied()
        serializer = GatewayOptions(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj, _ = PanelSettings.objects.select_for_update().get_or_create(pk=1)
        obj.data = {**obj.data, 'demo_gateway': serializer.validated_data}
        obj.save(update_fields=['data'])
        return Response(serializer.validated_data)


class DemoCheckout(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        options = gateway_options()
        if not options['enabled'] or active_impersonation(request):
            raise PermissionDenied()
        if request.user.role not in (User.Role.USER, User.Role.AGENCY, User.Role.SUPER_ADMIN):
            raise PermissionDenied()
        tier = serializers.ChoiceField(choices=[key for key in PLANS if key != 'free']).run_validation(request.data.get('tier'))
        result = serializers.ChoiceField(choices=['success', 'failure', 'cancelled']).run_validation(
            request.data.get('result', options['default_result']))
        return Response({'demo': True, 'tier': tier, 'amount': PLANS[tier][0], 'result': result,
                         'reference': 'DEMO-' + secrets.token_hex(6).upper() if result == 'success' else None})
