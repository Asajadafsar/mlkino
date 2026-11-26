from django.db import migrations, models


def mark_manual_slots(apps, schema_editor):
    VisitSlot = apps.get_model('panel', 'VisitSlot')
    WorkflowEvent = apps.get_model('panel', 'WorkflowEvent')
    alias = schema_editor.connection.alias
    scheduled_ids = {
        event['entity_id']
        for event in WorkflowEvent.objects.using(alias).filter(event='visit.slot.created').values_list('metadata', flat=True).iterator()
        if isinstance(event.get('entity_id'), int)
    }
    # Manual bookings used an implicit slot with capacity 50 and no scheduling event.
    legacy = VisitSlot.objects.using(alias).filter(capacity=50, bookings__isnull=False).distinct()
    private_ids = [pk for pk in legacy.values_list('pk', flat=True).iterator() if pk not in scheduled_ids]
    for offset in range(0, len(private_ids), 1000):
        VisitSlot.objects.using(alias).filter(pk__in=private_ids[offset:offset + 1000]).update(is_public=False)


class Migration(migrations.Migration):
    dependencies = [('panel', '0012_meeting_workflows')]

    operations = [
        migrations.AddField(model_name='visitslot', name='is_public', field=models.BooleanField(default=True)),
        migrations.RunPython(mark_manual_slots, migrations.RunPython.noop),
    ]
