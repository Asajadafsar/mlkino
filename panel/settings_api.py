import base64
import binascii
import copy
import io
import json
import re
import uuid
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .settings_models import PanelSettings

DEFAULTS = json.loads((Path(__file__).parent / "settings_defaults.json").read_text(encoding="utf-8"))
MAX_IMAGE = 5 * 1024 * 1024
IMAGE_KEYS = {("branding", "logo"), ("branding", "mobileLogo"), ("branding", "favicon"), ("seo", "ogImage")}
LENGTHS = {
    "general": {"panelName": 100, "shortName": 50, "description": 2000, "language": 35, "timezone": 64, "dateFormat": 32},
    "seo": {"title": 200, "description": 2000, "keywords": 1000},
    "contact": {"phone": 32, "email": 254, "address": 2000},
}
ROBOTS = {"index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"}
MODES = {"light", "dark", "system"}
DATA_RE = re.compile(r"^data:image/(png|jpeg|webp|gif|x-icon|vnd\.microsoft\.icon);base64,([A-Za-z0-9+/\r\n=]+)$", re.I)
HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")

def envelope(data=None, message="تنظیمات با موفقیت دریافت شد", code=200, errors=None):
    payload = {"statusCode": str(code), "status": code, "message": message}
    if errors is not None:
        payload["errors"] = errors
    else:
        payload["data"] = data
    return Response(payload, status=code)

def is_superadmin(user):
    return bool(user.is_authenticated and user.is_active and
                (user.is_superuser or getattr(user, "role", None) == "superadmin" or
                 getattr(user, "role", None) == getattr(getattr(type(user), "Role", None), "SUPER_ADMIN", object())))

def http_url(value):
    try:
        parsed = urlsplit(value)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc) and not any(c.isspace() for c in value) and len(value) <= 2048 and not parsed.username and not parsed.password
    except ValueError:
        return False

def validate_value(group, key, value):
    if isinstance(value, bool):
        return None if (group, key) == ("general", "maintenanceMode") else "مقدار این فیلد معتبر نیست."
    if (group, key) == ("general", "maintenanceMode"):
        return "لطفاً وضعیت روشن یا خاموش را انتخاب کنید."
    if not isinstance(value, str):
        return "مقدار این فیلد باید متن باشد."
    if (group, key) in IMAGE_KEYS:
        if value == "":
            return None
        if value.startswith("data:"):
            return None if DATA_RE.fullmatch(value) else "فرمت تصویر معتبر نیست."
        return None if http_url(value) else "لینک تصویر معتبر نیست."
    if group == "theme":
        if key == "mode":
            return None if value in MODES else "حالت نمایش انتخاب‌شده معتبر نیست."
        return None if HEX_RE.fullmatch(value) else "کد رنگ باید مانند #1E61CD باشد."
    max_length = LENGTHS.get(group, {}).get(key, 2048)
    if len(value) > max_length:
        return f"این فیلد نباید بیشتر از {max_length} کاراکتر باشد."
    if (group, key) == ("general", "panelName") and not value.strip():
        return "نام پنل نمی‌تواند خالی باشد."
    if group == "general" and key in ("language", "timezone", "dateFormat") and not value.strip():
        return "این فیلد نمی‌تواند خالی باشد."
    if (group, key) == ("general", "timezone"):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError, KeyError):
            return "منطقه زمانی معتبر نیست."
    if (group, key) == ("seo", "robots") and value not in ROBOTS:
        return "تنظیم ربات‌های جست‌وجو معتبر نیست."
    if (group, key) == ("contact", "email") and value:
        try:
            validate_email(value)
        except ValidationError:
            return "آدرس ایمیل معتبر نیست."
    if group == "contact" and key in ("instagram", "telegram", "linkedin", "whatsapp") and value and not http_url(value):
        return "لینک واردشده معتبر نیست."
    return None

def convert_image(value, group, key, public_base=""):
    if not value.startswith("data:"):
        return value, None
    match = DATA_RE.fullmatch(value)
    if not match:
        raise ValueError("فرمت تصویر معتبر نیست.")
    mime = match.group(1).lower()
    raw64 = match.group(2).replace("\n", "").replace("\r", "")
    if len(raw64) > (MAX_IMAGE * 4 // 3 + 100):
        raise ValueError("حجم تصویر بیشتر از ۵ مگابایت است.")
    try:
        binary = base64.b64decode(raw64, validate=True)
    except (ValueError, binascii.Error):
        raise ValueError("فایل تصویر قابل خواندن نیست.")
    if not binary or len(binary) > MAX_IMAGE:
        raise ValueError("حجم تصویر باید کمتر از ۵ مگابایت باشد.")
    ext = "ico" if mime in ("x-icon", "vnd.microsoft.icon") else ("jpg" if mime == "jpeg" else mime)
    try:
        from PIL import Image
        with Image.open(io.BytesIO(binary)) as img:
            if img.format.lower() not in ({"jpeg"} if ext == "jpg" else {ext}):
                raise ValueError("نوع فایل تصویر با محتوای آن مطابقت ندارد.")
            if img.width > 4096 or img.height > 4096:
                raise ValueError("ابعاد تصویر بیش از حد مجاز است.")
            img.verify()
    except ImportError:
        raise ValueError("برای بارگذاری تصویر کتابخانه Pillow روی سرور لازم است.")
    except ValueError:
        raise
    except Exception:
        raise ValueError("تصویر انتخاب‌شده معتبر نیست.")
    name = f"panel-settings/{group}/{key}/{uuid.uuid4().hex}.{ext}"
    saved = default_storage.save(name, ContentFile(binary))
    try:
        url = default_storage.url(saved)
        if url.startswith("/"):
            request_base = getattr(settings, "PANEL_SETTINGS_PUBLIC_BASE_URL", "") or public_base
            if not request_base:
                raise ValueError("آدرس عمومی فایل‌ها روی سرور تنظیم نشده است.")
            url = request_base.rstrip("/") + url
        if not http_url(url):
            raise ValueError("آدرس عمومی تصویر معتبر نیست.")
        return url, saved
    except Exception:
        default_storage.delete(saved)
        raise

class PanelSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_superadmin(request.user):return envelope(message='این بخش فقط برای سوپرادمین است.',code=403)
        obj = PanelSettings.objects.filter(pk=1).first()
        result = copy.deepcopy(DEFAULTS)
        if obj and isinstance(obj.data, dict):
            for group, values in obj.data.items():
                if group in result and isinstance(values, dict):
                    for key, value in values.items():
                        if key in result[group]:
                            result[group][key] = value
        return envelope(result)

    @transaction.atomic
    def patch(self, request):
        if not is_superadmin(request.user):
            return envelope(message="شما اجازه تغییر تنظیمات پنل را ندارید.", code=403, errors={})
        incoming = request.data
        if not isinstance(incoming, dict) or not incoming:
            return envelope(message="لطفاً تنظیماتی برای ذخیره انتخاب کنید.", code=400, errors={})
        errors = {}
        for group, changes in incoming.items():
            if group not in DEFAULTS:
                errors[group] = ["این بخش تنظیمات شناخته‌شده نیست."]
                continue
            if not isinstance(changes, dict) or not changes:
                errors[group] = ["لطفاً حداقل یک فیلد را وارد کنید."]
                continue
            for key, value in changes.items():
                field = f"{group}.{key}"
                if key not in DEFAULTS[group]:
                    errors[field] = ["این گزینه در تنظیمات وجود ندارد."]
                    continue
                error = validate_value(group, key, value)
                if error:
                    errors[field] = [error]
        if errors:
            return envelope(message="برخی اطلاعات تنظیمات نیاز به اصلاح دارند.", code=400, errors=errors)

        obj, _ = PanelSettings.objects.select_for_update().get_or_create(pk=1, defaults={"data": copy.deepcopy(DEFAULTS)})
        updated = copy.deepcopy(DEFAULTS)
        if isinstance(obj.data, dict):
            for group, values in obj.data.items():
                if group in updated and isinstance(values, dict):
                    updated[group].update({key: value for key, value in values.items() if key in updated[group]})
        created_files = []
        try:
            for group, changes in incoming.items():
                for key, value in changes.items():
                    if (group, key) in IMAGE_KEYS and value.startswith("data:"):
                        value, saved = convert_image(value, group, key, request.build_absolute_uri("/").rstrip("/"))
                        if saved:
                            created_files.append(saved)
                    updated[group][key] = value
            obj.data = updated
            obj.updated_by = request.user
            obj.save()
        except ValueError as exc:
            for name in created_files:
                default_storage.delete(name)
            transaction.set_rollback(True)
            return envelope(message="تصویر انتخاب‌شده قابل ذخیره نیست.", code=400, errors={"image": [str(exc)]})
        except Exception:
            for name in created_files:
                default_storage.delete(name)
            raise
        from django.core.cache import cache
        cache.delete('mlkino:system-settings')
        return envelope(updated, "تنظیمات با موفقیت ذخیره شد.")


class PanelAppearanceView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request):
        obj=PanelSettings.objects.filter(pk=1).first()
        result=copy.deepcopy(DEFAULTS)
        if obj and isinstance(obj.data,dict):
            for group in ('general','branding','theme','seo'):
                if isinstance(obj.data.get(group),dict):result[group].update({key:value for key,value in obj.data[group].items() if key in result[group]})
        return envelope(data={key:result[key] for key in ('general','branding','theme','seo')})
