import re
from django.core.exceptions import ValidationError


def validate_iranian_national_code(value: str) -> str:
    """اعتبارسنجی کد ملی ایران (۱۰ رقم با الگوریتم چک‌سام)"""
    if not value:
        raise ValidationError("کد ملی الزامی است.")

    value = str(value).strip()

    if not re.fullmatch(r"\d{10}", value):
        raise ValidationError("کد ملی باید ۱۰ رقم عددی باشد.")

    # کدهای تکراری که الگوریتم را رد می‌کنند
    if value in {str(i) * 10 for i in range(10)}:
        raise ValidationError("کد ملی وارد شده معتبر نیست.")

    check = int(value[9])
    s = sum(int(value[i]) * (10 - i) for i in range(9))
    r = s % 11

    if not ((r < 2 and check == r) or (r >= 2 and check == 11 - r)):
        raise ValidationError("کد ملی وارد شده معتبر نیست.")

    return value


def validate_iranian_mobile(value: str) -> str:
    """اعتبارسنجی شماره موبایل ایران (09xxxxxxxxx)"""
    if not value:
        raise ValidationError("شماره موبایل الزامی است.")

    value = str(value).strip()
    value = value.replace(" ", "").replace("-", "")

    # تبدیل +98 به 0
    if value.startswith("+98"):
        value = "0" + value[3:]
    elif value.startswith("98") and len(value) == 12:
        value = "0" + value[2:]

    if not re.fullmatch(r"09\d{9}", value):
        raise ValidationError("شماره موبایل معتبر نیست (مثال: 09123456789).")

    return value