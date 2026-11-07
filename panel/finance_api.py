"""Versioned Decimal calculations and immutable, balanced posted journals."""
from decimal import Decimal,InvalidOperation,ROUND_HALF_UP
from datetime import date
from django.db import transaction
from django.db.models import Q,Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date as django_parse_date,parse_datetime as django_parse_datetime
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied,ValidationError
from .models import FinancialDocument,FinancialRateVersion,CRMContact,EstateActivity,UserBusinessRole
from .settings_api import envelope,is_superadmin
from .workflow_services import workspaces,workspace,audit,feature
from .workflow_pagination import filtered,paginate

CENT=Decimal('.01')
def parse_date(value):
    try:return django_parse_date(value)
    except (ValueError,TypeError):raise ValidationError('تاریخ معتبر وارد کنید.')
def positive_id(value):
    if isinstance(value,(bool,float)) or not str(value).isdigit() or int(value)<1:raise ValidationError('شناسه معتبر انتخاب کنید.')
    return int(value)
def money(value,positive=False):
    try:n=Decimal(str(value).translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹','0123456789')).replace(',',''))
    except (InvalidOperation,ValueError,TypeError):raise ValidationError('مبلغ معتبر وارد کنید.')
    if not n.is_finite() or n<0 or n>Decimal('1e17') or positive and n<=0 or n.as_tuple().exponent < -2:raise ValidationError('مبلغ خارج از محدوده یا دارای اعشار نامعتبر است.')
    return n.quantize(CENT)
def finance_scope(user):
    qs=FinancialDocument.objects.select_related('created_by','party','activity','rate_version')
    if is_superadmin(user):return qs
    if user.role=='agency':return qs.filter(workspace=user)
    granted=UserBusinessRole.objects.filter(user=user,role='finance').values_list('workspace_id',flat=True)
    return qs.filter(Q(workspace_id__in=granted)|Q(kind='settlement',party__user=user)) if user.role=='expert' else qs.filter(workspace_id__in=granted)
def can_finance(user,workspace_id=None):
    if is_superadmin(user) or user.role=='agency' and (workspace_id is None or workspace_id==user.pk):return
    grants=UserBusinessRole.objects.filter(user=user,role='finance')
    if workspace_id is not None:grants=grants.filter(workspace_id=workspace_id)
    if not grants.exists():raise PermissionDenied('ثبت مالی فقط برای مدیر دفتر یا مسئول مالی مجاز است.')
def calc(amount,rate,expert=None,when=None):
    values=dict(rate.data)
    agreement=None;expert=expert or rate.expert
    if expert:
        from .models import ExpertShareAgreement
        agreement=ExpertShareAgreement.objects.filter(workspace_id=rate.workspace_id,expert=expert,valid_from__lte=when or timezone.localdate()).first()
        if agreement:values['expert_share_rate']=str(agreement.share_percent)
    gross=(amount*money(values.get('commission_rate','0'))/100).quantize(CENT,ROUND_HALF_UP)
    tax=(gross*money(values.get('tax_rate','0'))/100).quantize(CENT,ROUND_HALF_UP)
    deductions=money(values.get('deductions','0'))
    if deductions>gross:raise ValidationError('کسورات نباید از کمیسیون بیشتر باشد.')
    net=gross-deductions;expert_amount=(net*Decimal(values.get('expert_share_rate','0'))/100).quantize(CENT,ROUND_HALF_UP)
    return {k:str(v) for k,v in {'transaction_amount':amount,'gross':gross,'tax':tax,'invoice_total':gross+tax,'deductions':deductions,'expert_share':expert_amount,'office_share':net-expert_amount,'net':net}.items()}|{'rate_version':rate.pk,'mode':values.get('mode','agreed'),'expert_id':expert.pk if expert else None,'agreement_version':agreement.pk if agreement else None}
def clean_entries(raw,amount,kind):
    if not raw:
        debit,credit={'invoice':('receivables','commission_income'),'payment':('cash','receivables'),'settlement':('expert_payable','cash')}[kind]
        raw=[{'account':debit,'debit':str(amount),'credit':'0.00'},{'account':credit,'debit':'0.00','credit':str(amount)}]
    if not isinstance(raw,list) or not 2<=len(raw)<=100:raise ValidationError('سند باید حداقل دو ردیف حسابداری داشته باشد.')
    cleaned=[]
    for e in raw:
        if not isinstance(e,dict) or not isinstance(e.get('account'),str) or not e['account'].strip() or len(e['account'])>100:raise ValidationError('حساب معتبر انتخاب کنید.')
        d=money(e.get('debit',0));c=money(e.get('credit',0))
        if bool(d)==bool(c):raise ValidationError('هر ردیف فقط بدهکار یا فقط بستانکار باشد.')
        cleaned.append({'account':e['account'].strip(),'debit':str(d),'credit':str(c)})
    if sum(Decimal(e['debit']) for e in cleaned)!=sum(Decimal(e['credit']) for e in cleaned):raise ValidationError('جمع بدهکار و بستانکار برابر نیست.')
    if sum(Decimal(e['debit']) for e in cleaned)!=amount:raise ValidationError('جمع سند با مبلغ اعلام‌شده برابر نیست.')
    return cleaned

def serialize(row):
    result={'id':row.pk,'kind':row.kind,'workspace_id':row.workspace_id,'activity_id':row.activity_id,'party_id':row.party_id,'party_name':row.party.name if row.party else '', 'payee_expert_id':row.party.user_id if row.party and 'expert' in row.party.roles else None,'amount':str(row.amount),'direction':row.direction,'status':row.status,'description':row.description,'entries':row.entries,'calculation':row.calculation,'created_at':row.created_at.isoformat(),'posted_at':row.posted_at.isoformat() if row.posted_at else None,'reverses_id':row.reverses_id,'receipt_url':f'/panel/workflows/finance/{row.pk}/receipt/' if row.receipt else None,**row.data}
    if row.kind=='invoice':
        paid=sum((r.amount for r in FinancialDocument.objects.filter(workspace_id=row.workspace_id,kind='payment',status='posted',data__invoice_id=row.pk)),Decimal(0))
        result.update(paid_amount=str(paid),outstanding=str(max(Decimal(0),row.amount-paid)),payment_status='paid' if paid>=row.amount else 'partial' if paid else 'pending')
    return result


class FinancialSettingsView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('finance');qs=FinancialRateVersion.objects.all()
        if request.user.role!='expert':can_finance(request.user)
        if request.user.role=='expert':qs=qs.filter(expert=request.user)
        if not is_superadmin(request.user):qs=qs.filter(workspace_id__in=workspaces(request.user))
        return envelope({'results':[{'id':r.pk,'version':r.pk,'effective_from':r.valid_from.isoformat(),'valid_to':r.valid_to.isoformat() if r.valid_to else None,'workspace_id':r.workspace_id,'expert_id':r.expert_id,**r.data} for r in qs[:200]],'total_results':qs.count()})
    def post(self,request):
        feature('finance');can_finance(request.user);data=request.data
        allowed={'effective_from','valid_to','commission_rate','tax_rate','expert_share_rate','deductions','mode','province','city','expert_id','account_reference','settlement_method','workspace_id'}
        if set(data)-allowed:raise ValidationError('فیلد تنظیم مالی معتبر نیست.')
        start=parse_date(str(data.get('effective_from','')));end=parse_date(str(data.get('valid_to',''))) if data.get('valid_to') else None
        if not start or end and end<start:raise ValidationError('بازه اعتبار نرخ معتبر نیست.')
        values={k:data.get(k,'') for k in ('mode','province','city','account_reference','settlement_method')}
        if values['mode'] not in ('legal','agreed'):raise ValidationError('نوع نرخ را مشخص کنید؛ نرخ قانونی را مدیر باید ثبت کند.')
        for key in ('commission_rate','tax_rate','expert_share_rate','deductions'):
            n=money(data.get(key,0))
            if key!='deductions' and n>100:raise ValidationError('درصد باید بین صفر و صد باشد.')
            values[key]=str(n)
        for k in ('province','city','account_reference','settlement_method'):
            if not isinstance(values[k],str) or len(values[k])>200:raise ValidationError('متن تنظیمات مالی معتبر نیست.')
        ws=positive_id(data.get('workspace_id') or workspace(request.user));can_finance(request.user,ws)
        expert_id=positive_id(data['expert_id']) if data.get('expert_id') else None
        if expert_id:
            from .models import AgencyExpertLink
            if not AgencyExpertLink.objects.filter(agency_id=ws,expert_id=expert_id).exists():raise ValidationError('کارشناس متعلق به این دفتر نیست.')
        row=FinancialRateVersion.objects.create(workspace_id=ws,expert_id=expert_id,valid_from=start,valid_to=end,data=values)
        audit(request.user,'finance.rate.created','rate',row.pk)
        return envelope({'id':row.pk,'version':row.pk,**values},code=201)

class CommissionCalculateView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        can_finance(request.user);rate=get_object_or_404(FinancialRateVersion,pk=positive_id(request.data.get('rate_version_id')))
        can_finance(request.user,rate.workspace_id)
        when=parse_date(str(request.data.get('date',timezone.localdate())))
        if not when or not(rate.valid_from<=when and (not rate.valid_to or when<=rate.valid_to)):raise ValidationError('نرخ در تاریخ معامله معتبر نیست.')
        from accounts.models import User
        expert=get_object_or_404(User,pk=positive_id(request.data['expert_id']),role='expert') if request.data.get('expert_id') else None
        if expert and not __import__('panel.models',fromlist=['AgencyExpertLink']).AgencyExpertLink.objects.filter(agency_id=rate.workspace_id,expert=expert).exists():raise ValidationError('کارشناس متعلق به دفتر نیست.')
        return envelope(calc(money(request.data.get('transaction_amount'),True),rate,expert,when))

class FinancialDocumentView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,pk=None):
        feature('finance');qs=finance_scope(request.user)
        if pk:return envelope(serialize(get_object_or_404(qs,pk=pk)))
        if request.query_params.get('experts')=='true':
            can_finance(request.user)
            from .models import AgencyExpertLink
            links=AgencyExpertLink.objects.filter(expert__role='expert',expert__is_active=True).select_related('expert')
            if not is_superadmin(request.user):links=links.filter(agency_id__in=workspaces(request.user))
            people={}
            for link in links.order_by('id')[:2000]:people.setdefault(link.expert_id,{'id':link.expert_id,'full_name':link.expert.full_name,'workspace_id':link.agency_id})
            return envelope({'results':list(people.values()),'total_results':len(people)})
        if request.query_params.get('status'):qs=qs.filter(status=request.query_params['status'])
        if request.query_params.get('kind'):qs=qs.filter(kind=request.query_params['kind'])
        qs=filtered(qs,request)
        totals=qs.filter(status__in=('posted','reversed')).aggregate(debit=Sum('amount',filter=Q(direction='debit')),credit=Sum('amount',filter=Q(direction='credit')))
        debit=totals['debit'] or Decimal(0);credit=totals['credit'] or Decimal(0)
        return envelope({**paginate(qs,request,serialize),'summary':{'debit':str(debit),'credit':str(credit),'balance':str(debit-credit)}})
    @transaction.atomic
    def post(self,request):
        feature('finance');can_finance(request.user);d=dict(request.data)
        nested=d.pop('metadata',{})
        if not isinstance(nested,dict) or set(nested)-{'payment_date','source_account','destination_account','reference','method'}:raise ValidationError('اطلاعات پرداخت معتبر نیست.')
        for key,value in nested.items():d[{'payment_date':'paid_at','reference':'tracking_number','method':'payment_method'}.get(key,key)]=value

        allowed={'kind','activity_id','party_id','expert_id','amount','direction','description','entries','rate_version_id','transaction_amount','reverses_id','idempotency_key','workspace_id','payment_method','tracking_number','source_account','destination_account','receipt','paid_at','invoice_id','transaction_date','metadata'}
        if set(d)-allowed:raise ValidationError('فیلد سند معتبر نیست.')
        kind=d.get('kind');direction=d.get('direction','debit')
        if kind not in ('invoice','payment','settlement','reversal') or direction not in ('debit','credit'):raise ValidationError('نوع سند معتبر نیست.')
        ws=positive_id(d.get('workspace_id') or workspace(request.user));can_finance(request.user,ws)
        from accounts.models import User
        get_object_or_404(User.objects.select_for_update(of=('self',)),pk=ws)
        key=d.get('idempotency_key')
        if kind in ('payment','settlement','reversal') and not key:raise ValidationError('شناسه تکرارناپذیری برای عملیات مالی لازم است.')
        if key:
            import uuid
            try:key=uuid.UUID(str(key))
            except ValueError:raise ValidationError('شناسه تکرارناپذیری معتبر نیست.')
            old=FinancialDocument.objects.filter(idempotency_key=key).first()
            if old:
                if old.workspace_id!=ws:raise PermissionDenied()
                return envelope(serialize(old))
        amount=money(d.get('amount'),True);activity=None;party=None;rate=None;calculation={};reverses=None
        if d.get('activity_id'):
            from .estate_activity_api import visible
            activity=get_object_or_404(visible(request.user),pk=positive_id(d['activity_id']),kind='contracts')
            if workspace(activity.created_by)!=ws and not is_superadmin(request.user):raise PermissionDenied()
        if d.get('party_id'):party=get_object_or_404(CRMContact,pk=positive_id(d['party_id']),workspace_id=ws)
        payee=None
        if d.get('expert_id'):
            if kind!='settlement':raise ValidationError('کارشناس دریافت‌کننده فقط برای تسویه کارشناس انتخاب می‌شود.')
            from .models import AgencyExpertLink
            link=get_object_or_404(AgencyExpertLink.objects.select_related('expert'),agency_id=ws,expert_id=positive_id(d['expert_id']),expert__role='expert')
            payee=link.expert
            if party and party.user_id!=payee.pk:raise ValidationError('طرف حساب با کارشناس دریافت‌کننده مطابقت ندارد.')
            party,_=CRMContact.objects.get_or_create(workspace_id=ws,phone=payee.phone,defaults={'user':payee,'name':payee.full_name or 'کارشناس دفتر','roles':['expert']})
            if party.user_id and party.user_id!=payee.pk:raise ValidationError('شماره کارشناس به طرف حساب دیگری متصل است.')
            party.user=payee;party.roles=list(dict.fromkeys([*party.roles,'expert']));party.save(update_fields=['user','roles','updated_at'])
        if d.get('rate_version_id'):
            rate=get_object_or_404(FinancialRateVersion,pk=positive_id(d['rate_version_id']),workspace_id=ws)
            when=parse_date(str(d.get('transaction_date') or (activity.data.get('contract_datetime','')[:10] if activity else '') or timezone.localdate()))
            if not when:raise ValidationError('تاریخ معامله معتبر نیست.')
            if not rate.valid_from<=when or rate.valid_to and rate.valid_to<when:raise ValidationError('نرخ در این تاریخ معتبر نیست.')
            if payee and rate.expert_id and rate.expert_id!=payee.pk:raise ValidationError('نسخه توافق متعلق به کارشناس دریافت‌کننده نیست.')
            calculation=calc(money(d.get('transaction_amount'),True),rate,payee or (activity.assigned_expert if activity and activity.assigned_expert_id else None),when)
            if kind=='invoice' and amount!=Decimal(calculation['invoice_total']):raise ValidationError('مبلغ صورتحساب باید با جمع کمیسیون و مالیات محاسبه‌شده برابر باشد.')
        if kind=='reversal':
            reverses=get_object_or_404(FinancialDocument.objects.select_for_update(of=('self',)),pk=positive_id(d.get('reverses_id')),workspace_id=ws,status='posted')
            if hasattr(reverses,'reversal'):raise ValidationError('این سند قبلاً برگشت خورده است.')
            amount=reverses.amount;direction='credit' if reverses.direction=='debit' else 'debit';entries=[{'account':e['account'],'debit':e['credit'],'credit':e['debit']} for e in reverses.entries]
        else:
            entries=d.get('entries')
            if not entries and kind=='invoice' and calculation:
                entries=[{'account':'receivables','debit':str(amount),'credit':'0.00'},{'account':'commission_income','debit':'0.00','credit':calculation['gross']}]
                if Decimal(calculation['tax']):entries.append({'account':'tax_payable','debit':'0.00','credit':calculation['tax']})
            entries=clean_entries(entries,amount,kind)
        description=d.get('description','')
        if not isinstance(description,str) or len(description)>2000:raise ValidationError('شرح معتبر وارد کنید.')
        metadata={k:('' if d.get(k) is None else d.get(k,'')) for k in ('payment_method','tracking_number','source_account','destination_account','receipt','paid_at')}
        if metadata.get('paid_at'):
            try:parsed=django_parse_datetime(metadata['paid_at'])
            except (ValueError,TypeError):raise ValidationError('زمان پرداخت معتبر وارد کنید.')
            if not parsed or timezone.is_naive(parsed):raise ValidationError('زمان پرداخت باید دارای منطقه زمانی باشد.')
        if d.get('invoice_id'):

            original=get_object_or_404(FinancialDocument.objects.select_for_update(of=('self',)),pk=positive_id(d['invoice_id']),workspace_id=ws,kind='invoice',status='posted')
            metadata['invoice_id']=original.pk

        if any(not isinstance(v,str) or len(v)>500 for k,v in metadata.items() if k!='invoice_id'):raise ValidationError('اطلاعات پرداخت معتبر نیست.')
        row=FinancialDocument.objects.create(workspace_id=ws,created_by=request.user,activity=activity,party=party,rate_version=rate,reverses=reverses,kind=kind,direction=direction,amount=amount,description=description,entries=entries,calculation=calculation,data=metadata,idempotency_key=key)
        audit(request.user,'finance.draft.created','financial_document',row.pk)
        return envelope(serialize(row),code=201)

class FinancialPostView(APIView):
    permission_classes=[IsAuthenticated]
    @transaction.atomic
    def post(self,request,pk):
        feature('finance');row=get_object_or_404(finance_scope(request.user).select_for_update(of=('self',)),pk=pk);can_finance(request.user,row.workspace_id)
        if row.status=='posted':return envelope(serialize(row))
        if row.status!='draft':raise ValidationError('این سند قابل ثبت نهایی نیست.')
        if row.kind=='payment' and row.data.get('invoice_id'):
            invoice=FinancialDocument.objects.select_for_update(of=('self',)).get(pk=row.data['invoice_id'],workspace_id=row.workspace_id,kind='invoice')
            if invoice.status!='posted':raise ValidationError('فاکتور قابل پرداخت نیست.')
            paid=sum((r.amount for r in FinancialDocument.objects.filter(workspace=row.workspace,kind='payment',status='posted',data__invoice_id=invoice.pk)),Decimal(0))
            if paid+row.amount>invoice.amount:raise ValidationError('مبلغ پرداخت از مانده فاکتور بیشتر است.')
        if row.kind!='reversal':clean_entries(row.entries,row.amount,row.kind)
        if row.reverses_id:
            original=FinancialDocument.objects.select_for_update(of=('self',)).get(pk=row.reverses_id)
            if original.status!='posted':raise ValidationError('سند اصلی قابل برگشت نیست.')
            original.status='reversed';original.save(update_fields=['status'])
        row.status='posted';row.approved_by=request.user;row.posted_at=timezone.now();row.save(update_fields=['status','approved_by','posted_at'])
        audit(request.user,'finance.posted','financial_document',row.pk,status='posted')
        from accounts.notices import notify
        notify(row.created_by,'finance','سند مالی ثبت نهایی شد',link=f'/finance?document={row.pk}')
        return envelope(serialize(row))

class LedgerView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        feature('finance');totals={}
        for row in finance_scope(request.user).filter(status__in=['posted','reversed']):
            for e in row.entries:
                account=totals.setdefault(e['account'],{'debit':Decimal(0),'credit':Decimal(0)})
                account['debit']+=Decimal(e['debit']);account['credit']+=Decimal(e['credit'])
        rows=[{'account':k,'debit':str(v['debit']),'credit':str(v['credit']),'balance':str(v['debit']-v['credit'])} for k,v in totals.items()]
        return envelope({'results':rows,'total_results':len(rows)})

class FinancialReceiptView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,pk):
        feature('finance');row=get_object_or_404(finance_scope(request.user),pk=pk)
        if not row.receipt:
            from django.http import Http404
            raise Http404
        from django.http import FileResponse
        response=FileResponse(row.receipt.open('rb'),as_attachment=True,filename='receipt'+__import__('pathlib').Path(row.receipt.name).suffix,content_type='application/octet-stream')
        response['Cache-Control']='private, no-store';response['X-Content-Type-Options']='nosniff';response['Content-Security-Policy']="sandbox; default-src 'none'"
        return response
    @transaction.atomic
    def post(self,request,pk):
        feature('finance');row=get_object_or_404(finance_scope(request.user).select_for_update(of=('self',)),pk=pk);can_finance(request.user,row.workspace_id)
        if row.status!='draft':raise ValidationError('رسید سند ثبت‌شده قابل جایگزینی نیست؛ سند اصلاحی ایجاد کنید.')
        upload=request.FILES.get('receipt')
        if not upload:raise ValidationError('فایل رسید را انتخاب کنید.')
        from accounts.media_processing import sanitized_document
        row.receipt=sanitized_document(upload);row.save(update_fields=['receipt']);audit(request.user,'finance.receipt.attached','financial_document',row.pk)
        return envelope(serialize(row))
