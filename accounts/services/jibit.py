import logging

import requests

logger = logging.getLogger(__name__)


# ==================================================================
# تنظیمات جیبیت (کلیدهای ملکینو)
# ==================================================================
JIBIT_API_KEY = "zxjeqihcnF"
JIBIT_SECRET_KEY = "tKB5SP63MrXVArRDw2w0DTy38"
JIBIT_BASE_URL = "https://napi.jibit.ir/ide"


class JibitError(Exception):
    """خطای سرویس جیبیت"""
    pass


# ==================================================================
# دریافت توکن
# ==================================================================
def get_access_token() -> str:
    """دریافت توکن جدید از جیبیت."""
    url = f"{JIBIT_BASE_URL}/v1/tokens/generate"
    headers = {"Content-Type": "application/json"}
    body = {"apiKey": JIBIT_API_KEY, "secretKey": JIBIT_SECRET_KEY}

    try:
        response = requests.post(url, headers=headers, json=body, timeout=15)
    except requests.RequestException as exc:
        logger.error("Jibit token request failed: %s", exc)
        raise JibitError("خطا در ارتباط با سرویس جیبیت") from exc

    try:
        data = response.json()
    except ValueError:
        logger.error("Jibit token response not JSON: %s", response.text[:200])
        raise JibitError("پاسخ نامعتبر از سرویس جیبیت")

    if response.status_code != 200:
        logger.error("Jibit token HTTP %s: %s", response.status_code, data)
        raise JibitError(
            f"خطا در دریافت توکن: {data.get('message', 'unknown error')}"
        )

    access_token = data.get("accessToken")
    if not access_token:
        logger.error("Jibit token response missing accessToken: %s", data)
        raise JibitError("توکن جیبیت دریافت نشد")

    return access_token


# ==================================================================
# تطبیق کد ملی با شماره موبایل (شاهکار)
# ==================================================================
def shahkar_match(national_code: str, mobile_number: str) -> bool:
    """
    بررسی تطابق کد ملی با شماره موبایل (سرویس شاهکار).

    Returns:
        True اگر تطابق داشته باشند.

    Raises:
        JibitError: با پیام مناسب بر اساس نوع خطا.
    """
    token = get_access_token()

    url = f"{JIBIT_BASE_URL}/v1/services/matching"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "nationalCode": national_code,
        "mobileNumber": mobile_number,
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=15)
    except requests.RequestException as exc:
        logger.error("Jibit shahkar request failed: %s", exc)
        raise JibitError("خطا در ارتباط با سرویس احراز هویت") from exc

    try:
        data = response.json()
    except ValueError:
        logger.error("Jibit shahkar response not JSON: %s", response.text[:200])
        raise JibitError("پاسخ نامعتبر از سرویس احراز هویت")

    logger.info(
        "Jibit shahkar: national_code=%s mobile=%s status=%s matched=%s",
        national_code,
        mobile_number,
        response.status_code,
        data.get("matched"),
    )

    # --------------------------------------------------------------
    # خطای 400 — ورودی نامعتبر یا عدم تطابق
    # --------------------------------------------------------------
    if response.status_code == 400:
        error_data = str(data).lower()
        error_message = data.get("message", "")

        if "not found" in error_data or "وجود ندارد" in error_message:
            raise JibitError("کد ملی وارد شده در ثبت احوال موجود نیست")
        elif "mobile" in error_data and (
            "invalid" in error_data or "نامعتبر" in error_message
        ):
            raise JibitError("شماره موبایل وارد شده نامعتبر است")
        elif (
            "not match" in error_data
            or "mismatch" in error_data
            or "تطابق" in error_message
        ):
            raise JibitError("مالکیت کد ملی و شماره موبایل وارد شده مطابقت ندارد")
        else:
            raise JibitError(error_message or "اطلاعات وارد شده نامعتبر است")

    # --------------------------------------------------------------
    # سایر خطاهای HTTP
    # --------------------------------------------------------------
    if response.status_code != 200:
        error_message = data.get(
            "message", "خطا در ارتباط با سرویس احراز هویت"
        )
        logger.error(
            "Jibit shahkar HTTP %s: %s", response.status_code, data
        )
        raise JibitError(error_message)

    # --------------------------------------------------------------
    # بررسی نتیجه تطابق
    # --------------------------------------------------------------
    matched = data.get("matched", False)
    if not matched:
        raise JibitError("مالکیت کد ملی و شماره موبایل وارد شده مطابقت ندارد")

    return True