
import logging
import os

import requests
from zeep import Client, Settings
from zeep.transports import Transport

logger = logging.getLogger(__name__)

# ==========================================================
# MeliPayamak configuration
# ==========================================================

MELIPAYAMAK_USERNAME = os.getenv(
    "MELIPAYAMAK_USERNAME",
    "9019621710",
).strip()

MELIPAYAMAK_API_KEY = os.getenv(
    "MELIPAYAMAK_API_KEY",
    "00975fe4-5a22-427f-b670-cdb6dc0ae5a7",
).strip()

MELIPAYAMAK_FROM = os.getenv(
    "MELIPAYAMAK_FROM",
    "50002710021717",
).strip()

MELIPAYAMAK_OTP_BODY_ID = os.getenv(
    "MELIPAYAMAK_OTP_BODY_ID",
    "560449",
).strip()

MELIPAYAMAK_WSDL_URL = os.getenv(
    "MELIPAYAMAK_WSDL_URL",
    "http://api.payamak-panel.com/post/Send.asmx?wsdl",
).strip()

SMS_MODE = os.getenv("SMS_MODE", "melipayamak").strip().lower()
SMS_TIMEOUT = int(os.getenv("SMS_TIMEOUT", "20"))

ERRORS = {
    "-111": "IP درخواست‌کننده نامعتبر است.",
    "-110": "استفاده از API Key الزامی است.",
    "-109": "IP مجاز برای وب‌سرویس تنظیم نشده است.",
    "-108": "IP به علت تلاش ناموفق مسدود شده است.",
    "-10": "متغیرهای ارسالی شامل لینک هستند.",
    "-7": "شماره فرستنده نامعتبر است.",
    "-6": "خطای داخلی ملی‌پیامک.",
    "-5": "متغیرهای ارسالی با متن الگو مطابقت ندارند.",
    "-4": "شناسه الگو نامعتبر است یا هنوز تأیید نشده است.",
    "-3": "خط ارسال در سامانه تعریف نشده است.",
    "-2": "محدودیت تعداد شماره‌های گیرنده.",
    "-1": "دسترسی وب‌سرویس غیرفعال است.",
    "0": "اطلاعات ورود به سرویس نامعتبر است.",
    "2": "اعتبار حساب کافی نیست.",
    "6": "سامانه در حال به‌روزرسانی است.",
    "7": "متن پیامک دارای کلمه فیلترشده است.",
    "10": "حساب کاربری فعال نیست.",
    "11": "ارسال انجام نشده است.",
    "12": "مدارک حساب کامل نیست.",
    "16": "شماره گیرنده یافت نشد.",
    "17": "متن پیامک خالی است.",
    "18": "شماره گیرنده نامعتبر است.",
    "19": "محدودیت زمانی ارسال رعایت نشده است.",
    "35": "شماره در فهرست سیاه مخابرات است.",
}


class MeliPayamakError(Exception):
    def __init__(self, code, message=None):
        self.code = str(code)
        self.message = message or ERRORS.get(
            self.code,
            f"خطای ملی‌پیامک: {self.code}",
        )
        super().__init__(self.message)


def _validate_config():
    if SMS_MODE != "melipayamak":
        raise MeliPayamakError(
            "CONFIG",
            "حالت ارسال واقعی فعال نیست؛ SMS_MODE باید melipayamak باشد.",
        )

    if not MELIPAYAMAK_USERNAME or not MELIPAYAMAK_API_KEY:
        raise MeliPayamakError(
            "CONFIG",
            "نام کاربری یا API Key تنظیم نشده است.",
        )

    if not MELIPAYAMAK_WSDL_URL:
        raise MeliPayamakError(
            "CONFIG",
            "آدرس WSDL تنظیم نشده است.",
        )


def _normalize_phone(phone):
    phone = str(phone).strip()
    phone = (
        phone.replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )

    if phone.startswith("+98"):
        phone = "0" + phone[3:]
    elif phone.startswith("0098"):
        phone = "0" + phone[4:]

    if (
        len(phone) != 11
        or not phone.isdigit()
        or not phone.startswith("09")
    ):
        raise MeliPayamakError(
            "INVALID_PHONE",
            "شماره موبایل باید در قالب 09xxxxxxxxx باشد.",
        )

    return phone


def _get_soap_client():
    _validate_config()

    session = requests.Session()
    transport = Transport(
        session=session,
        timeout=SMS_TIMEOUT,
        operation_timeout=SMS_TIMEOUT,
    )

    settings = Settings(
        strict=False,
        xml_huge_tree=False,
    )

    try:
        return Client(
            wsdl=MELIPAYAMAK_WSDL_URL,
            transport=transport,
            settings=settings,
        )
    except Exception as exc:
        logger.error(
            "Could not initialize MeliPayamak SOAP client: %s",
            type(exc).__name__,
        )
        raise MeliPayamakError(
            "WSDL",
            "اتصال به WSDL ملی‌پیامک برقرار نشد.",
        ) from exc


def _result_value(result, result_name):
    """
    Zeep ممکن است نتیجه را به شکل رشته یا شیء برگرداند.
    این تابع هر دو شکل را مدیریت می‌کند.
    """
    if hasattr(result, result_name):
        result = getattr(result, result_name)

    if isinstance(result, dict):
        result = result.get(result_name, result)

    if result is None:
        raise MeliPayamakError(
            "EMPTY_RESPONSE",
            "نتیجه‌ای از متد ملی‌پیامک دریافت نشد.",
        )

    value = str(result).strip()

    # در بعضی پاسخ‌های SOAP مقدار نتیجه در یک رشته قرار دارد.
    if value.lstrip("-").isdigit():
        return value

    logger.error(
        "Unexpected SOAP result type: %s",
        type(result).__name__,
    )

    raise MeliPayamakError(
        "INVALID_RESPONSE",
        "ساختار پاسخ SOAP قابل تشخیص نیست.",
    )


def _check_send_result(result):
    result = str(result).strip()

    # طبق مستندات، recId بزرگ‌تر از 15 رقم موفقیت است.
    if result.isdigit() and len(result) > 15:
        logger.info("MeliPayamak accepted SMS request.")
        return result

    logger.warning("MeliPayamak rejected SMS request: code=%s", result)

    raise MeliPayamakError(result)


# ==========================================================
# OTP: SOAP SendByBaseNumber
# ==========================================================

def send_otp_sms(phone: str, code: str) -> str:
    phone = _normalize_phone(phone)
    code = str(code).strip()

    if not code or not code.isdigit():
        raise MeliPayamakError(
            "INVALID_OTP",
            "کد تأیید معتبر نیست.",
        )

    if not MELIPAYAMAK_OTP_BODY_ID.isdigit():
        raise MeliPayamakError(
            "CONFIG",
            "شناسه الگوی OTP باید عددی باشد.",
        )

    client = _get_soap_client()

    # طبق مستندات، text آرایه‌ای از متغیرهای الگو است.
    # تعداد و ترتیب مقادیر باید دقیقاً با پترن پنل مطابقت داشته باشد.
    text_values = [code, code]

    try:
        result = client.service.SendByBaseNumber(
            username=MELIPAYAMAK_USERNAME,
            password=MELIPAYAMAK_API_KEY,
            text=text_values,
            to=phone,
            bodyId=int(MELIPAYAMAK_OTP_BODY_ID),
        )

    except Exception as exc:
        logger.error(
            "MeliPayamak SendByBaseNumber SOAP error: %s",
            type(exc).__name__,
        )
        raise MeliPayamakError(
            "SOAP_REQUEST",
            "در اجرای متد SendByBaseNumber خطای SOAP رخ داد.",
        ) from exc

    result = _result_value(
        result,
        "SendByBaseNumberResult",
    )

    return _check_send_result(result)


# ==========================================================
# SMS: SOAP SendSimpleSMS2
# ==========================================================

def send_sms(phone: str, message: str) -> str:
    phone = _normalize_phone(phone)
    message = str(message).strip()

    if not message:
        raise MeliPayamakError(
            "EMPTY_MESSAGE",
            "متن پیامک خالی است.",
        )

    if "لغو11" not in message:
        message = f"{message}\nلغو11"

    client = _get_soap_client()

    try:
        result = client.service.SendSimpleSMS2(
            username=MELIPAYAMAK_USERNAME,
            password=MELIPAYAMAK_API_KEY,
            to=phone,
            from_=MELIPAYAMAK_FROM,
            text=message,
            isflash=False,
        )

    except Exception as exc:
        logger.error(
            "MeliPayamak SendSimpleSMS2 SOAP error: %s",
            type(exc).__name__,
        )
        raise MeliPayamakError(
            "SOAP_REQUEST",
            "در اجرای متد ارسال پیامک خطای SOAP رخ داد.",
        ) from exc

    result = _result_value(
        result,
        "SendSimpleSMS2Result",
    )

    return _check_send_result(result)
