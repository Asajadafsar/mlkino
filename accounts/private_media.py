"""Authenticated document delivery; never accept a user-supplied filesystem path."""
from pathlib import PurePosixPath
from django.contrib.auth import get_user_model
from django.http import FileResponse, Http404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

DOCUMENT_FIELDS = {'national-card': ('', 'national_code_image'),
                   'agency-license': ('agency_profile', 'license_image'),
                   'expert-document': ('expert_profile', 'professional_document')}
MIMES = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
         '.webp': 'image/webp', '.avif': 'image/avif', '.pdf': 'application/pdf'}


def document_url(user_id, kind, request=None):
    path=f'/accounts/documents/{user_id}/{kind}/'
    return request.build_absolute_uri(path) if request is not None else path


class PrivateDocumentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, kind):
        if kind not in DOCUMENT_FIELDS:
            raise Http404
        from panel.settings_api import is_superadmin
        allowed = request.user.pk == user_id or is_superadmin(request.user)
        if not allowed and request.user.role == 'agency':
            from panel.models import AgencyExpertLink
            allowed = AgencyExpertLink.objects.filter(agency_id=request.user.pk, expert_id=user_id).exists()
        if not allowed:
            raise Http404
        user = get_user_model().objects.filter(pk=user_id).select_related('agency_profile', 'expert_profile').first()
        if user is None:
            raise Http404
        relation, field = DOCUMENT_FIELDS[kind]
        try:
            value = getattr(getattr(user, relation) if relation else user, field)
        except (AttributeError, get_user_model().DoesNotExist):
            raise Http404
        if not value:
            raise Http404
        try:
            handle = value.storage.open(value.name, 'rb')
        except (FileNotFoundError, OSError):
            raise Http404
        suffix = PurePosixPath(value.name).suffix.lower()
        response = FileResponse(handle, as_attachment=True, filename=kind + (suffix if suffix in MIMES else '.bin'),
                                content_type=MIMES.get(suffix, 'application/octet-stream'))
        response['Cache-Control'] = 'private, no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        response['Content-Security-Policy'] = "sandbox; default-src 'none'"
        return response


from rest_framework import serializers

class PrivateDocumentField(serializers.FileField):
    def __init__(self, kind, *, images_only=False, **kwargs):
        self.document_kind=kind
        self.images_only=images_only
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        from .media_processing import sanitized_document
        value=super().to_internal_value(data)
        return sanitized_document(value,images_only=self.images_only)

    def to_representation(self, value):
        if not value:
            return None
        owner=getattr(value,'instance',None)
        user_id=(getattr(owner,'manager_id',None) if self.document_kind=='agency-license' else
                 getattr(owner,'user_id',None) if self.document_kind=='expert-document' else
                 getattr(owner,'pk',None))
        if not user_id:
            return None
        return document_url(user_id,self.document_kind,self.context.get('request'))
