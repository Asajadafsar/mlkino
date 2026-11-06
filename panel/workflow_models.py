"""Relational complements; reuse existing users, property files and activities."""
from django.conf import settings
from django.db import models
from django.db.models import Q

class CRMContact(models.Model):
    properties=models.ManyToManyField('panel.PropertyRecord',blank=True,related_name='crm_contacts')
    workspace=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='crm_workspace_contacts')
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name='crm_contacts')
    expert=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name='managed_contacts')
    name=models.CharField(max_length=200)
    phone=models.CharField(max_length=20)
    roles=models.JSONField(default=list)
    data=models.JSONField(default=dict)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        ordering=['-updated_at','-id']
        constraints=[models.UniqueConstraint(fields=['workspace','phone'],name='crm_workspace_phone_unique')]

class PropertyReferral(models.Model):
    property=models.ForeignKey('panel.PropertyRecord',on_delete=models.PROTECT,related_name='referrals')
    expert=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,null=True,blank=True,related_name='property_referrals')
    status=models.CharField(max_length=16,default='pending',db_index=True)
    expires_at=models.DateTimeField(null=True,blank=True,db_index=True)
    attempt=models.PositiveIntegerField(default=1)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        ordering=['-created_at','-id']
        constraints=[models.UniqueConstraint(fields=['property','attempt'],name='referral_attempt_unique'),models.UniqueConstraint(fields=['property'],condition=Q(status='pending'),name='referral_one_pending')]

class WorkflowEvent(models.Model):
    property=models.ForeignKey('panel.PropertyRecord',on_delete=models.PROTECT,null=True,blank=True,related_name='workflow_events')
    actor=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True)
    event=models.CharField(max_length=50,db_index=True)
    metadata=models.JSONField(default=dict)
    created_at=models.DateTimeField(auto_now_add=True,db_index=True)
    class Meta:ordering=['created_at','id']

class PropertyFavorite(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='property_favorites')
    property=models.ForeignKey('panel.PropertyRecord',on_delete=models.CASCADE,related_name='favorites')
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering=['-created_at','-id']
        constraints=[models.UniqueConstraint(fields=['user','property'],name='property_favorite_unique')]

class VisitSlot(models.Model):
    property=models.ForeignKey('panel.PropertyRecord',on_delete=models.PROTECT,related_name='visit_slots')
    expert=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='visit_slots')
    starts_at=models.DateTimeField(db_index=True)
    ends_at=models.DateTimeField()
    capacity=models.PositiveSmallIntegerField(default=1)
    active=models.BooleanField(default=True)
    class Meta:
        ordering=['starts_at','id']
        constraints=[models.CheckConstraint(condition=Q(ends_at__gt=models.F('starts_at')),name='visit_slot_positive_duration'),models.CheckConstraint(condition=Q(capacity__gte=1),name='visit_slot_positive_capacity')]

class PropertyVisit(models.Model):
    slot=models.ForeignKey(VisitSlot,on_delete=models.PROTECT,related_name='bookings')
    visitor=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='property_visits')
    status=models.CharField(max_length=16,default='pending',db_index=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        ordering=['-created_at','-id']
        constraints=[models.UniqueConstraint(fields=['slot','visitor'],condition=Q(status__in=['pending','confirmed']),name='visit_active_booking_unique')]

class PropertyOffer(models.Model):
    request=models.ForeignKey('panel.PropertyRecord',on_delete=models.PROTECT,related_name='offers')
    property=models.ForeignKey('panel.PropertyRecord',on_delete=models.PROTECT,related_name='offered_for')
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT)
    message=models.CharField(max_length=2000,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering=['-created_at','-id']
        constraints=[models.UniqueConstraint(fields=['request','property','created_by'],name='property_offer_unique')]

class FinancialRateVersion(models.Model):
    workspace=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='financial_rates')
    expert=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,null=True,blank=True,related_name='financial_agreements')
    valid_from=models.DateField()
    valid_to=models.DateField(null=True,blank=True)
    data=models.JSONField(default=dict)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:ordering=['-valid_from','-id']

class FinancialDocument(models.Model):
    workspace=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='financial_documents')
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT)
    approved_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,null=True,blank=True,related_name='approved_financial_documents')
    activity=models.ForeignKey('panel.EstateActivity',on_delete=models.PROTECT,null=True,blank=True,related_name='financial_documents')
    party=models.ForeignKey(CRMContact,on_delete=models.PROTECT,null=True,blank=True,related_name='financial_documents')
    rate_version=models.ForeignKey(FinancialRateVersion,on_delete=models.PROTECT,null=True,blank=True)
    reverses=models.OneToOneField('self',on_delete=models.PROTECT,null=True,blank=True,related_name='reversal')
    kind=models.CharField(max_length=16)
    direction=models.CharField(max_length=6,default='debit')
    amount=models.DecimalField(max_digits=20,decimal_places=2)
    status=models.CharField(max_length=16,default='draft',db_index=True)
    description=models.CharField(max_length=2000,blank=True)
    receipt=models.FileField(upload_to='private_finance/receipts/%Y/%m/',null=True,blank=True)
    entries=models.JSONField(default=list)
    calculation=models.JSONField(default=dict)
    data=models.JSONField(default=dict)
    idempotency_key=models.UUIDField(null=True,blank=True,unique=True)
    created_at=models.DateTimeField(auto_now_add=True)
    posted_at=models.DateTimeField(null=True,blank=True)
    class Meta:
        ordering=['-created_at','-id']
        constraints=[models.CheckConstraint(condition=Q(amount__gt=0),name='financial_document_positive_amount')]

class UserBusinessRole(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='business_roles')
    workspace=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='workspace_roles')
    role=models.CharField(max_length=20)
    class Meta:constraints=[models.UniqueConstraint(fields=['user','workspace','role'],name='user_workspace_role_unique')]

class PropertyChat(models.Model):
    property=models.ForeignKey('panel.PropertyRecord',on_delete=models.PROTECT,related_name='property_chats')
    conversation=models.ForeignKey('panel.DirectConversation',on_delete=models.PROTECT,related_name='property_contexts')
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT)
    class Meta:constraints=[models.UniqueConstraint(fields=['property','user'],name='property_chat_user_unique')]

class SavedReportFilter(models.Model):
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='saved_report_filters')
    name=models.CharField(max_length=100)
    report=models.CharField(max_length=20)
    filters=models.JSONField(default=dict)
    updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        ordering=['name','id']
        constraints=[models.UniqueConstraint(fields=['user','name'],name='report_filter_user_name_unique')]

class ConversationArchive(models.Model):
    conversation=models.ForeignKey('panel.DirectConversation',on_delete=models.CASCADE,related_name='user_archives')
    user=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE)
    archived_at=models.DateTimeField(auto_now_add=True)
    class Meta:constraints=[models.UniqueConstraint(fields=['conversation','user'],name='conversation_archive_user_unique')]

class ExpertShareAgreement(models.Model):
    workspace=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='expert_share_agreements')
    expert=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT,related_name='share_agreements')
    share_percent=models.DecimalField(max_digits=7,decimal_places=4)
    valid_from=models.DateField()
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering=['-valid_from','-created_at','-id']
        constraints=[models.CheckConstraint(condition=Q(share_percent__gte=0)&Q(share_percent__lte=100),name='expert_share_valid_percent')]
