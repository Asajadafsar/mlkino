"""Gradual bounded conversion; old files/URLs are retained for backwards compatibility."""
import json
from django.core.management.base import BaseCommand, CommandError
from django.core.files.storage import default_storage
from django.db import transaction
from rest_framework.exceptions import ValidationError
from accounts.media_processing import local_media_path, store_property_image, decode_raster
from panel.models import PropertyRecord

class Command(BaseCommand):
    help = 'بررسی یا تبدیل تدریجی تصاویر محلی املاک؛ پیش‌فرض فقط بررسی است و فایل قدیمی حذف نمی‌شود.'

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='نوشتن نسخه WebP جدید و به‌روزرسانی تصاویر رکورد؛ فایل قبلی حفظ می‌شود.')
        parser.add_argument('--batch-size', type=int, default=25)
        parser.add_argument('--after-id', type=int, default=0)
        parser.add_argument('--max-records', type=int, default=100)

    def handle(self, *args, **options):
        if not 1 <= options['batch_size'] <= 200 or not 1 <= options['max_records'] <= 10000 or options['after_id'] < 0:
            raise CommandError('اندازه دسته ۱ تا ۲۰۰، تعداد رکورد ۱ تا ۱۰۰۰۰ و شناسه غیرمنفی باشد.')
        stats={'mode':'apply' if options['apply'] else 'dry-run','checked':0,'eligible':0,'converted':0,'skipped':0,'failed':0,'next_after_id':options['after_id']}
        rows=PropertyRecord.objects.filter(pk__gt=options['after_id']).order_by('pk')[:options['max_records']]
        for record in rows.iterator(chunk_size=options['batch_size']):
            stats['checked']+=1;stats['next_after_id']=record.pk
            original=record.data.get('images',[])
            if not isinstance(original,list):stats['skipped']+=1;continue
            updated=[];created=[];variants={};changed=False;converted_count=0
            existing_variants=record.data.get('image_variants',{})
            if not isinstance(existing_variants,dict):existing_variants={}
            try:
                for url in original:
                    path=local_media_path(url) if isinstance(url,str) else None
                    if not path or existing_variants.get(url) or not default_storage.exists(path):
                        updated.append(url);continue
                    with default_storage.open(path,'rb') as file:
                        if not options['apply']:
                            decode_raster(file);stats['eligible']+=1;updated.append(url);continue
                        result=store_property_image(file)
                    stats['eligible']+=1
                    created.extend(result['stored_paths'])
                    if not result['url'].startswith(('https://','http://')):
                        raise CommandError('PANEL_SETTINGS_PUBLIC_BASE_URL برای URL عمومی تصاویر تنظیم نشده است.')
                    updated.append(result['url']);variants[result['url']]=result['variants'];changed=True;converted_count+=1
                if not changed:continue
                with transaction.atomic():
                    current=PropertyRecord.objects.select_for_update().get(pk=record.pk)
                    if current.data.get('images',[])!=original:
                        for path in created:default_storage.delete(path)
                        stats['skipped']+=1;continue
                    previous_variants=current.data.get('image_variants',{})
                    if not isinstance(previous_variants,dict):previous_variants={}
                    current.data={**current.data,'images':updated,'image_variants':{**previous_variants,**variants}}
                    current.save(update_fields=['data','updated_at'])
                stats['converted']+=converted_count
            except (ValidationError,OSError,ValueError,CommandError):
                for path in created:default_storage.delete(path)
                stats['failed']+=1
        self.stdout.write(json.dumps(stats,ensure_ascii=False))
