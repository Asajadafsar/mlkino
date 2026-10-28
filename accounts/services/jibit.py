
import logging
import re
import time

import requests

from django.core.cache import cache


logger = logging.getLogger(__name__)


# ============================================================
# JIBIT CONFIGURATION
# ============================================================

JIBIT_API_KEY = "zxjeqihcnF"
JIBIT_SECRET_KEY = "tKB5SP63MrXVArRDw2w0DTy38"

JIBIT_BASE_URL = "https://napi.jibit.ir/ide"

JIBIT_CONNECT_TIMEOUT = 5
JIBIT_READ_TIMEOUT = 20

JIBIT_TOKEN_CACHE_KEY = "mlkino_jibit_access_token"
JIBIT_TOKEN_DEFAULT_TTL = 240


# ============================================================
# EXCEPTION
# ============================================================

class JibitError(Exception):
    """
    Custom exception for Jibit API errors.
    """

    def __init__(
        self,
        message,
        code=None,
        status_code=400,
    ):
        self.message = str(message)
        self.code = code
        self.status_code = status_code

        super().__init__(self.message)


# ============================================================
# HELPERS
# ============================================================

def _parse_json(response):
    try:
        data = response.json()

        if not isinstance(data, dict):
            raise ValueError("Invalid JSON object")

        return data

    except ValueError as exc:
        logger.error(
            "Jibit invalid JSON response. HTTP=%s",
            response.status_code,
        )

        raise JibitError(
            "پاسخ نامعتبر از سرویس جیبیت دریافت شد.",
            code="invalid_response",
            status_code=502,
        ) from exc


def _request(method, url, **kwargs):
    kwargs.setdefault(
        "timeout",
        (
            JIBIT_CONNECT_TIMEOUT,
            JIBIT_READ_TIMEOUT,
        ),
    )

    try:
        return requests.request(
            method=method,
            url=url,
            **kwargs,
        )

    except requests.Timeout as exc:
        logger.warning(
            "Jibit request timeout: %s",
            url,
        )

        raise JibitError(
            "زمان پاسخ‌گویی سرویس جیبیت به پایان رسید.",
            code="request_timeout",
            status_code=504,
        ) from exc

    except requests.RequestException as exc:
        logger.error(
            "Jibit connection error: %s",
            type(exc).__name__,
        )

        raise JibitError(
            "ارتباط با سرویس جیبیت برقرار نشد.",
            code="connection_error",
            status_code=503,
        ) from exc


def _get_error_code(data):
    error = data.get("error")

    if isinstance(error, dict):
        return str(
            error.get("code")
            or error.get("errorCode")
            or ""
        ).strip().lower()

    if isinstance(error, str):
        return error.strip().lower()

    return str(
        data.get("code")
        or data.get("errorCode")
        or ""
    ).strip().lower()


def _get_error_message(data):
    error = data.get("error")

    if isinstance(error, dict):
        return str(
            error.get("message")
            or data.get("message")
            or ""
        ).strip()

    return str(
        data.get("message")
        or ""
    ).strip()


# ============================================================
# ACCESS TOKEN
# ============================================================

def get_access_token(force_refresh=False):
    """
    Get Jibit access token and cache it.
    """

    if not force_refresh:
        cached_token = cache.get(
            JIBIT_TOKEN_CACHE_KEY
        )

        if cached_token:
            return cached_token

    url = (
        f"{JIBIT_BASE_URL}"
        "/v1/tokens/generate"
    )

    response = _request(
        "POST",
        url,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={
            "apiKey": JIBIT_API_KEY,
            "secretKey": JIBIT_SECRET_KEY,
        },
    )

    data = _parse_json(response)

    if response.status_code != 200:
        logger.error(
            "Jibit token generation failed. HTTP=%s",
            response.status_code,
        )

        raise JibitError(
            "دریافت توکن جیبیت ناموفق بود.",
            code="token_generation_failed",
            status_code=502,
        )

    access_token = data.get("accessToken")

    if not access_token:
        raise JibitError(
            "توکن دسترسی جیبیت دریافت نشد.",
            code="missing_access_token",
            status_code=502,
        )

    expires_in = data.get(
        "expiresIn",
        JIBIT_TOKEN_DEFAULT_TTL + 60,
    )

    try:
        expires_in = int(expires_in)

        cache_ttl = max(
            30,
            expires_in - 60,
        )

    except (TypeError, ValueError):
        cache_ttl = JIBIT_TOKEN_DEFAULT_TTL

    cache.set(
        JIBIT_TOKEN_CACHE_KEY,
        access_token,
        cache_ttl,
    )

    return access_token


# ============================================================
# AUTHENTICATED REQUEST
# ============================================================

def _authorized_get(path, params=None):
    """
    GET request with automatic token refresh on HTTP 401.
    """

    url = f"{JIBIT_BASE_URL}{path}"

    token = get_access_token()

    for attempt in range(2):
        response = _request(
            "GET",
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/json",
            },
            params=params or {},
        )

        if response.status_code == 401 and attempt == 0:
            cache.delete(
                JIBIT_TOKEN_CACHE_KEY
            )

            token = get_access_token(
                force_refresh=True
            )

            continue

        return response, _parse_json(response)

    raise JibitError(
        "احراز هویت سرویس جیبیت ناموفق بود.",
        code="authentication_failed",
        status_code=502,
    )


# ============================================================
# POSTAL CODE VALIDATION
# ============================================================

def normalize_postal_code(value):
    """
    Normalize Persian/Arabic digits and validate postal code.
    """

    if value is None:
        raise JibitError(
            "وارد کردن کد پستی الزامی است.",
            code="postal_code_required",
        )

    translation = str.maketrans(
        "۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩",
        "01234567890123456789",
    )

    code = str(value).strip().translate(
        translation
    )

    if not re.fullmatch(
        r"[0-9]{10}",
        code,
    ):
        raise JibitError(
            "کد پستی باید دقیقاً ۱۰ رقم باشد.",
            code="postal_code_invalid",
        )

    return code


# ============================================================
# SHAHKAR MATCHING
# ============================================================

def shahkar_match(
    national_code: str,
    mobile_number: str,
) -> bool:
    """
    Match Iranian national code with mobile number.
    """

    response, data = _authorized_get(
        "/v1/services/matching",
        params={
            "nationalCode": national_code,
            "mobileNumber": mobile_number,
        },
    )

    if response.status_code == 200:
        if data.get("matched") is True:
            return True

        raise JibitError(
            "مالکیت کد ملی و شماره موبایل مطابقت ندارد.",
            code="shahkar_mismatch",
        )

    error_code = _get_error_code(data)
    error_message = _get_error_message(data)

    if response.status_code == 400:
        error_text = (
            f"{error_code} {error_message}"
        ).lower()

        if (
            "not_found" in error_text
            or "not found" in error_text
            or "وجود ندارد" in error_text
        ):
            message = (
                "کد ملی واردشده در ثبت احوال موجود نیست."
            )

        elif (
            "mobile" in error_text
            and (
                "invalid" in error_text
                or "نامعتبر" in error_text
            )
        ):
            message = (
                "شماره موبایل واردشده نامعتبر است."
            )

        elif (
            "mismatch" in error_text
            or "not_match" in error_text
            or "تطابق" in error_text
        ):
            message = (
                "مالکیت کد ملی و شماره موبایل مطابقت ندارد."
            )

        else:
            message = (
                "اطلاعات هویتی واردشده نامعتبر است."
            )

        raise JibitError(
            message,
            code=error_code or "shahkar_invalid",
        )

    if response.status_code in (401, 403):
        raise JibitError(
            "دسترسی به سرویس احراز هویت مجاز نیست.",
            code="shahkar_forbidden",
            status_code=502,
        )

    if response.status_code == 429:
        raise JibitError(
            "محدودیت درخواست سرویس احراز هویت فعال شده است.",
            code="shahkar_rate_limited",
            status_code=429,
        )

    raise JibitError(
        "استعلام احراز هویت در حال حاضر امکان‌پذیر نیست.",
        code=error_code or "shahkar_error",
        status_code=502,
    )


# ============================================================
# POSTAL LOOKUP ERROR MESSAGES
# ============================================================

POSTAL_ERROR_MESSAGES = {
    "invalid.request_body":
        "درخواست استعلام کد پستی نامعتبر است.",

    "forbidden":
        "دسترسی به سرویس استعلام کد پستی مجاز نیست.",

    "postalcode.not_valid":
        "کد پستی واردشده نامعتبر است.",

    "postalcode.not_found":
        "اطلاعاتی برای این کد پستی یافت نشد.",

    "daily_limit.reached":
        "سقف روزانه استعلام کد پستی تکمیل شده است.",

    "providers.not_available":
        "سرویس استعلام کد پستی موقتاً در دسترس نیست.",

    "server.error":
        "خطای داخلی در سرویس استعلام کد پستی رخ داده است.",
}


# ============================================================
# POSTAL LOOKUP
# ============================================================

def postal_lookup(code: str) -> dict:
    """
    Get address information using postal code.

    Endpoint:
        GET /v1/services/postal?code=XXXXXXXXXX

    Returns:
        {
            "postal_code": "...",
            "province": "...",
            "city": "...",
            "address": "...",
            "street": "...",
            "no": "...",
            "floor": "..."
        }
    """

    postal_code = normalize_postal_code(
        code
    )

    response, data = _authorized_get(
        "/v1/services/postal",
        params={
            "code": postal_code,
        },
    )

    # --------------------------------------------------------
    # ERROR HANDLING
    # --------------------------------------------------------

    if response.status_code != 200:
        error_code = _get_error_code(data)

        message = POSTAL_ERROR_MESSAGES.get(
            error_code,
            "استعلام کد پستی انجام نشد. لطفاً دوباره تلاش کنید.",
        )

        logger.warning(
            "Jibit postal lookup failed. HTTP=%s error=%s",
            response.status_code,
            error_code,
        )

        if error_code in (
            "postalcode.not_valid",
            "invalid.request_body",
        ):
            status_code = 400

        elif error_code == "postalcode.not_found":
            status_code = 404

        elif error_code == "daily_limit.reached":
            status_code = 429

        elif error_code == "providers.not_available":
            status_code = 503

        else:
            status_code = 502

        raise JibitError(
            message,
            code=error_code or "postal_lookup_failed",
            status_code=status_code,
        )

    # --------------------------------------------------------
    # RESPONSE VALIDATION
    # --------------------------------------------------------

    address_info = data.get(
        "addressInfo"
    )

    if not isinstance(
        address_info,
        dict,
    ):
        logger.error(
            "Jibit postal response missing addressInfo"
        )

        raise JibitError(
            "اطلاعات آدرس در پاسخ جیبیت موجود نیست.",
            code="postal_address_missing",
            status_code=502,
        )

    returned_code = (
        address_info.get("postalCode")
        or data.get("code")
        or postal_code
    )

    returned_code = normalize_postal_code(
        returned_code
    )

    if returned_code != postal_code:
        raise JibitError(
            "کد پستی پاسخ جیبیت با کد پستی درخواست‌شده مطابقت ندارد.",
            code="postal_code_mismatch",
            status_code=502,
        )

    province = str(
        address_info.get("Province")
        or address_info.get("province")
        or ""
    ).strip()

    city = str(
        address_info.get("district")
        or ""
    ).strip()

    address = str(
        address_info.get("address")
        or ""
    ).strip()

    street = str(
        address_info.get("street")
        or ""
    ).strip()

    building_no = str(
        address_info.get("no")
        or ""
    ).strip()

    floor = str(
        address_info.get("floor")
        or ""
    ).strip()

    if not province:
        raise JibitError(
            "استان در پاسخ استعلام کد پستی مشخص نیست.",
            code="postal_province_missing",
            status_code=502,
        )

    if not city:
        raise JibitError(
            "شهرستان در پاسخ استعلام کد پستی مشخص نیست.",
            code="postal_city_missing",
            status_code=502,
        )

    if not address:
        raise JibitError(
            "آدرس کامل در پاسخ استعلام کد پستی موجود نیست.",
            code="postal_address_incomplete",
            status_code=502,
        )

    return {
        "postal_code": returned_code,
        "province": province,
        "city": city,
        "address": address,
        "street": street,
        "no": building_no,
        "floor": floor,
    }
