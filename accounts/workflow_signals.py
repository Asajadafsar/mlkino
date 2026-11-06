"""Capture share agreement versions without rewriting historical calculations."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from accounts.models import ExpertProfile
from panel.models import AgencyExpertLink,ExpertShareAgreement

def capture(profile,workspace_id):
    if profile.commission_share_rate is None:return
    if not 0<=profile.commission_share_rate<=100:return
    latest=ExpertShareAgreement.objects.filter(workspace_id=workspace_id,expert_id=profile.user_id).first()
    if latest and latest.share_percent==profile.commission_share_rate:return
    ExpertShareAgreement.objects.create(workspace_id=workspace_id,expert_id=profile.user_id,share_percent=profile.commission_share_rate,valid_from=timezone.localdate())
@receiver(post_save,sender=ExpertProfile)
def profile_agreement(sender,instance,**kwargs):
    for workspace_id in AgencyExpertLink.objects.filter(expert_id=instance.user_id).values_list('agency_id',flat=True):capture(instance,workspace_id)
@receiver(post_save,sender=AgencyExpertLink)
def link_agreement(sender,instance,created,**kwargs):
    if created:
        profile=ExpertProfile.objects.filter(user_id=instance.expert_id).first()
        if profile:capture(profile,instance.agency_id)
