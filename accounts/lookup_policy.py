"""Provider failures are distinct from invalid user data; never fabricate verification."""
import logging
from .services.jibit import JibitError
from .validators import validate_iranian_national_code,validate_iranian_mobile
logger=logging.getLogger(__name__)

def service_error(exc,kind):
    label='تطبیق هویت' if kind=='identity' else 'استعلام کد پستی'
    code=str(exc.code or '')
    if code=='balance.not_enough':return JibitError(f'اعتبار سرویس {label} سامانه تمام شده است؛ این خطا به اطلاعات شما مربوط نیست. پشتیبانی باید اعتبار سرویس را شارژ کند.',code=code,status_code=503)
    if code in ('providers.not_available','shahkar_forbidden','unauthorized','forbidden') or exc.status_code>=500:return JibitError(f'سرویس {label} موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.',code=code or 'provider_unavailable',status_code=503)
    if exc.status_code==429:return JibitError(f'تعداد استعلام‌های {label} به سقف مجاز رسیده است؛ چند دقیقه دیگر دوباره تلاش کنید.',code=code,status_code=429)
    if kind=='identity':
        if any(marker in code.lower() for marker in ('mismatch','not_match')) or 'مطابقت ندارد' in str(exc):return JibitError('این شماره همراه به نام صاحب کد ملی واردشده نیست. شماره‌ای را وارد کنید که به نام خودتان است.',code=code,status_code=400)
        if 'ثبت احوال' in str(exc) and exc.status_code==400:return exc
        if 'national' in code or 'nationalcode' in code:return JibitError('کد ملی در سرویس ثبت احوال معتبر شناخته نشد. کد ده‌رقمی را بررسی کنید.',code=code,status_code=400)
        if 'mobile' in code:return JibitError('شماره همراه برای تطبیق هویت معتبر شناخته نشد. شماره را بررسی کنید.',code=code,status_code=400)
        return JibitError('سرویس تطبیق هویت پاسخ معتبری نداد؛ تأیید هویت انجام نشده است و پشتیبانی باید پاسخ سرویس را بررسی کند.',code=code or 'provider_invalid_response',status_code=502)
    return exc

def identity_lookup(national_code,phone,lookup):
    national_code=validate_iranian_national_code(national_code);phone=validate_iranian_mobile(phone)
    try:return lookup(national_code,phone)
    except JibitError as exc:
        logger.warning('Identity provider failed status=%s code=%s',exc.status_code,exc.code)
        raise service_error(exc,'identity') from exc

def outage(exc):return exc.status_code>=500 or exc.status_code==429

def resolve_postal(code,payload,lookup):
    try:return {**lookup(code),'address_source':'postal'}
    except JibitError as exc:
        error=service_error(exc,'postal')
        if not outage(error) or str(payload.get('postal_manual','')).lower() not in ('true','1'):raise error from exc
        from panel.geography_api import catalog,choose
        p=choose(catalog('provinces'),payload.get('province',''))
        cities=[r for r in catalog('cities-filtered') if p and r['province_id']==p['id']]
        c=choose(cities,payload.get('city',''))
        address=payload.get('address','')
        if not p or not c or not isinstance(address,str) or not 10<=len(address.strip())<=2000:raise JibitError('برای نشانی دستی، استان و شهر معتبر و آدرس کامل حداقل ۱۰ حرفی وارد کنید.',code='manual_address_invalid',status_code=400)
        return {'postal_code':code,'province':p['name'],'city':c['name'],'address':address.strip(),'address_source':'manual'}
