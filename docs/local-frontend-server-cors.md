# اتصال فرانت لوکال به API سرور

## اجرای پیشنهادی برای جلوگیری از CSRF cookie not set

در پوشه `frontend` اجرا کنید:

```bash
npm run start:server
```

فرانت روی `http://localhost:3000` اجرا می‌شود. در حالت توسعه، کلاینت این مخزن آدرس
API را به `/api` همان Origin تبدیل می‌کند؛ `src/setupProxy.js` درخواست‌ها را از
dev server به `https://api.mlkino.com` می‌فرستد. بنابراین کوکی برای مرورگر first-party
است و مسدودبودن third-party cookies مانع ورود نمی‌شود. اگر فرانت جداگانه‌ای دارید،
baseURL مرورگر باید `/api` و مقصد proxy سرور توسعه باید API واقعی باشد؛ hardcode کردن
آدرس مستقیم API در مرورگر، proxy را دور می‌زند.

این proxy فقط روی loopback و با Host/Origin متناظر کار می‌کند، به میزبان دلخواه
متصل نمی‌شود و TLS مقصد را اعتبارسنجی می‌کند. برای HTTP لوکال فقط ویژگی Secure
کوکی محلی حذف و SameSite به Lax تبدیل می‌شود؛ HttpOnly باقی می‌ماند. تنظیم و کوکی
واقعی API سرور همچنان Secure است و هیچ بررسی CSRF روی سرور حذف نشده است.
روی HTTPS لوکال، Secure نیز حفظ می‌شود. proxy برای شبکه LAN فعال نیست.

اگر VPN مسیر API را مسدود می‌کند، فقط برای فرایند dev server می‌توان آدرس رابط
مستقیم را مشخص کرد؛ تنظیم VPN سیستم تغییر نمی‌کند:

```bash
MLKINO_DEV_PROXY_LOCAL_ADDRESS="$(ipconfig getifaddr en0)" npm run start:server
```

bootstrap اکنون `csrfCookiePresent` هم برمی‌گرداند. فرانت در نخستین مراجعه تأیید
می‌کند کوکی واقعاً برگشته باشد؛ اگر cookie ذخیره نشده باشد، رمز را ارسال نمی‌کند.
اگر توکن حافظه قدیمی باشد، فقط پس از خطای صریح `csrf_failed` یک بار bootstrap و
تکرار درخواست انجام می‌شود؛ درخواست‌های ناموفق رمز یا خطاهای عمومی تکرار نمی‌شوند.

بررسی این اصلاح: ۲۱ تست بک‌اند، ۲۹ تست فرانت و بیلد پنل موفق شدند. تست Chrome با
third-party cookie restriction فعال، دریافت واقعی CSRF از API و ارسال فرم خالی
ورود از proxy را بررسی کرد: پاسخ ورود ۴۰۰ اعتبارسنجی بود، نه ۴۰۳ CSRF؛ کوکی HttpOnly
بود و رمز واقعی یا حساب آزمایشی به سرور ارسال/اضافه نشد.

## علت تأییدشده

روی سرور، OPTIONS با Origin لوکال ۲۰۰ بود ولی هدر `Access-Control-Allow-Origin`
نداشت. پاسخ ۴۰۱ نیز همین مشکل را داشت: تنظیم production فقط
`https://mlkino.com` را مجاز می‌دانست. Nginx هدر CORS تولید یا حذف نمی‌کرد.
علاوه بر این، کوکی‌ها `SameSite=Lax` بودند، مسیرهای اصلی `/api/accounts/`
و `/api/panel/` بودند و کنترل Origin قدیمی این پیشوندها را پوشش نمی‌داد.
جریان عمومی دریافت CSRF برای localhost وجود نداشت.

## تنظیمات جدید

- Originهای دقیق مجاز: `https://mlkino.com`، `http://localhost:3000` و `http://127.0.0.1:3000`.
- ارسال credential مجاز است؛ wildcard، regex عمومی و بازتاب بدون اعتبارسنجی نداریم.
- CorsMiddleware بیرونی‌ترین middleware است تا خطاهای Django نیز هدر داشته باشند.
- OPTIONS قبل از احراز هویت، CSRF و redirect پاسخ داده می‌شود.
- کوکی‌های access/refresh، session و CSRF در production امن و `SameSite=None` هستند.
  access/refresh و CSRF، HttpOnly و host-only هستند.
- برای درخواست‌های تغییردهنده‌ی مرورگر، Origin معتبر و تطبیق واقعی توکن با کوکی CSRF لازم است.
  درخواست دارای کوکی بدون Origin نیز باید بررسی استاندارد CSRF/Referer را بگذراند.
- `/accounts/` و `/panel/` روی API به عنوان مسیر سازگاری اضافه شده‌اند؛ مسیرهای `/api/` حفظ شده‌اند.
  پنل روی `mlkino.com/panel/` همچنان توسط Nginx سرو می‌شود.
- Django مالک هدر CORS پاسخ‌های عادی و خطاهای برنامه است. فقط خطاهای تولیدشده توسط
  Nginx (۴۱۳، ۵۰۲، ۵۰۳، ۵۰۴) از map دقیق و location داخلی هدر می‌گیرند؛ خطاهای upstream
  با `proxy_intercept_errors off` دست‌نخورده عبور می‌کنند.

## تغییر لازم سمت فرانت مستقل

`withCredentials` به‌تنهایی کافی نیست. جاوااسکریپت localhost نمی‌تواند کوکی سرور را
بخواند. ابتدا از endpoint عمومی زیر توکن **ماسک‌شده** را بگیرید. مرورگر کوکی را نگه
می‌دارد؛ توکن JSON در حافظه برنامه می‌ماند و در هدر درخواست بعدی ارسال می‌شود.
این توکن، access token یا refresh token نیست.

```ts
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.mlkino.com',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
})
let csrfToken = ''
let loading: Promise<string> | null = null
async function csrf() {
  if (csrfToken) return csrfToken
  if (!loading) loading = api.get('/accounts/csrf/')
    .then(({data}) => csrfToken = data.csrfToken)
    .finally(() => { loading = null })
  return loading
}
api.interceptors.request.use(async config => {
  // For an API-specific client only; never attach the token to third-party URLs.
  const target = new URL(config.url || '', config.baseURL)
  if (target.origin === 'https://api.mlkino.com' &&
      !/^(get|head|options)$/i.test(config.method || 'get')) {
    config.xsrfCookieName = '' // Prevent Axios overwriting the header with a local cookie.
    config.headers = {...config.headers, 'X-CSRFToken': await csrf()}
  }
  return config
})
api.interceptors.response.use(response => response, error => {
  if (error.response?.data?.error_code === 'csrf_failed') csrfToken = ''
  return Promise.reject(error)
})
// Example: await api.post('/accounts/login/password/', {phone, password})
```

در فرانت همین مخزن، `frontend/src/Core/Csrf.ts` این کار را برای Axios عمومی،
client پنل، ثبت‌نام و ورود مدیریتی انجام می‌دهد. refresh لندینگ نیز bootstrap دارد.
متغیر `REACT_APP_API_URL=https://api.mlkino.com` پیش از اجرای فرانت لوکال تنظیم شود؛
کد این مخزن `/api` را اضافه می‌کند، که همچنان معتبر است.

## CORS در برابر محدودیت کوکی third-party

اگر OPTIONS و پاسخ اصلی هدر صحیح دارند و JavaScript پاسخ را می‌خواند، CORS رفع شده است.
با این حال Safari، حالت خصوصی یا سیاست مسدودکردن third-party cookies ممکن است کوکی
`api.mlkino.com` را از صفحه localhost نپذیرد یا نفرستد، حتی با `SameSite=None; Secure`.
در DevTools بخش Cookies/Issues علت blocked cookie را ببینید. توکن JSON بدون کوکی
مطابق، عمداً با ۴۰۳ و `error_code=csrf_failed` رد می‌شود؛ نشست بدون کوکی با ۴۰۱ رد می‌شود.
این وضعیت را با بازکردن wildcard یا حذف CSRF حل نکنید.

برای توسعه در مرورگرهای دارای این محدودیت، از dev proxy هم‌مبدأ روی HTTPS محلی استفاده
کنید: مرورگر به `/api/` روی همان frontend درخواست بدهد و dev server آن را به API
سرور proxy کند؛ Origin و اعتبارسنجی TLS upstream حفظ شوند. کوکی‌های host-only به میزبان
محلی تعلق می‌گیرند؛ در صورت استفاده از کوکی domainدار، فقط در proxy توسعه domain را
rewrite کنید. کلید یا توکن HttpOnly را به localStorage یا query منتقل نکنید.

## بررسی بعد از انتشار

```bash
curl -i -X OPTIONS 'https://api.mlkino.com/accounts/login/password/' \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type,X-CSRFToken'

curl -i 'https://api.mlkino.com/accounts/session/' \
  -H 'Origin: http://127.0.0.1:3000'

curl -i 'https://api.mlkino.com/accounts/csrf/' \
  -H 'Origin: http://localhost:3000'
```

انتظار: OPTIONS بدون Location و بدون احراز هویت ۲۰۰؛ Allow-Origin دقیق همان Origin،
Allow-Credentials برابر true، Allow-Headers شامل Content-Type و X-CSRFToken.
نشست مهمان ۴۰۱ با هدر CORS؛ bootstrap برابر ۲۰۰ با csrfToken، no-store و کوکی امن.
Origin نامعتبر نباید Allow-Origin یا Allow-Credentials بگیرد.
در دستگاه فعلی مسیر VPN به سرور مختل است؛ برای curl از `--interface en0` و برای SSH
از `-B en0` استفاده شد؛ تنظیم VPN دستگاه تغییر نمی‌کند.

آزمون‌های HTTP و curl پذیرش third-party cookie توسط همه مرورگرها را اثبات نمی‌کنند.

مراجع: [django-cors-headers](https://github.com/adamchainz/django-cors-headers)،
[CSRF در Django](https://docs.djangoproject.com/en/6.0/howto/csrf/)،
[تنظیمات CSRF](https://docs.djangoproject.com/en/6.0/ref/csrf/)،
[کوکی‌های third-party و CORS در MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#third-party_cookies).


## انتشار انجام‌شده — ۲۰۲۶/۱۱/۱۹

نسخه‌ی `fb0a037` با شناسه‌ی `20261119-fb0a037-cors` روی سرور فعال شد.
بکاپ PostgreSQL، فایل‌های قبلی و تنظیم Nginx در
`/var/backups/mlkino/20261119-fb0a037-cors` است. هیچ migration جدیدی لازم نبود؛
کلیدها، تنظیمات دیتابیس و کد provider جیبیت تغییر نکردند.

مراحل اعمال‌شده:

1. تطبیق هش فایل‌های قبلی، گرفتن dump دیتابیس و بکاپ تنظیم Nginx.
2. نصب `accounts/csrf_api.py`، `accounts/middleware.py`، `accounts/urls.py`،
   `mlkino/urls.py` و `mlkino/production_settings.py` از بسته‌ی تست‌شده.
3. نصب دو فایل `api-cors-error-*.conf` با پیشوند `mlkino-` در `/etc/nginx/snippets/`؛
   include فایل map در scope مربوط به http و include locationها در هر دو server HTTPS.
4. اجرای `manage.py check`، بررسی سازگاری مدل/migration و `nginx -t`.
5. فعال‌کردن اتمیک بیلد جدید پنل و standalone لندینگ؛ restart سرویس‌های
   `mlkino-backend` و `mlkino-landing` و reload کردن Nginx.
6. اجرای `python3 deployment/check-cors-production.py --interface en0` روی دامنه.
   ۱۲ preflight، جریان توکن و کوکی، رد Origin نامعتبر و CORS خطاهای
   ۴۰۱/۴۰۳/۴۰۴/۴۱۳ موفق بودند؛ هدر CORS تکراری مشاهده نشد.

نتیجه‌ی آزمون‌های محلی: ۲۱ تست بک‌اند و ۱۶ تست فرانت پاس شد؛ هر دو بیلد موفق بودند
(پنل چند هشدار lint قدیمی دارد). هر سه سرویس active و enabled هستند.
رسید ماشین‌خوان: `deployment/audit/cors-result-20261119.json`.
فرانت مستقلی که از این مخزن استفاده نمی‌کند باید bootstrap و interceptor نمونه‌ی بالا
را اضافه کند؛ صرف افزودن withCredentials جای هدر CSRF را نمی‌گیرد.


## انتشار رفع cookie not set

نسخه‌ی `d83787e` با شناسه‌ی `20261119-d83787e-cookie` روی سرور فعال شد؛ پنل تولید
نیز بازیابی محدود CSRF و تشخیص برگشت کوکی را دارد. نسخه قبلی برای rollback حفظ شده
و بکاپ در `/var/backups/mlkino/20261119-d83787e-cookie` قرار دارد.
تنظیمات production مربوط به Secure، SameSite و اعتبارسنجی CSRF تغییر نکرده‌اند.

فرم واقعی React روی پورت ۳۰۰۰ هم با Chrome و محدودیت third-party cookies فعال تست
شد: با شماره نامعتبر `000` و رمز ساختگی، پاسخ ۴۰۰ اعتبارسنجی دریافت شد و خطای CSRF
وجود نداشت. ورود موفق با رمز واقعی کاربر در این تست انجام نشده است.
اسکریپت قابل تکرار: `deployment/check-local-login-browser.mjs`؛ به Chrome با پروفایل
آزمایشی و پورت debugging ۹۲۲۷ نیاز دارد.
نتیجه: `deployment/audit/cookie-result-20261119.json`.
