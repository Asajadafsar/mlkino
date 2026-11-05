# انتشار دامنه اصلی و نشست مشترک — ۱۴ آبان ۱۴۰۵

انتشار `20261105-001-landing` انجام شد. کل منبع برنامه در مخزن `https://github.com/Asajadafsar/mlkino` است: بک‌اند در ریشه، پنل در `frontend/` و لندینگ در `landing/`. Snapshot کد پنل/بک‌اند `ab39afb` و Snapshot تجمیع منبع کامل `5b254e4` است؛ تغییرات تجمیع، کد runtime منتشرشده را تغییر نداده‌اند.

| سرویس | آدرس | استقرار |
|---|---|---|
| لندینگ | https://mlkino.com | Next.js 16.4.5، Node.js 24.22.2 LTS، سرویس `mlkino-landing` |
| پنل | https://panel.mlkino.com | خروجی React، symlink نسخه جدید |
| API و WebSocket | https://api.mlkino.com | Gunicorn و ASGI موجود |

`www.mlkino.com` و HTTP دامنه اصلی به `https://mlkino.com` هدایت می‌شوند. DNS مرجع، Google و Cloudflare همگی IP سرور `212.80.20.75` را نشان دادند. گواهی لندینگ تا ۳ فوریه ۲۰۲۷ معتبر است؛ timer تمدید Certbot و hook بررسی/reload Nginx فعال‌اند. TLS 1.2/1.3 تنظیم شده و اتصال معتبر TLS 1.3 روی هر سه دامنه مستقلاً تأیید شد.

لندینگ با کاربر مستقل `mlkino-landing` فقط روی `127.0.0.1:3101` گوش می‌دهد. systemd با `NoNewPrivileges`، `ProtectSystem=strict` و `ProtectHome` اجرا می‌شود. تنها cache برنامه قابل نوشتن است. پوشه release و API موجود جایگزین با مخزن خام یا settings لوکال نشده‌اند.

## احراز هویت و امنیت

- کوکی‌های access/refresh همچنان Secure، HttpOnly و host-only روی `api.mlkino.com` هستند؛ توکن در URL یا localStorage لندینگ قرار نمی‌گیرد.
- `GET /accounts/session/` فقط شناسه، نام، تصویر و عنوان نقش را با `private, no-store` برمی‌گرداند.
- CORS credentialed فقط برای مبدأهای دقیق و مورد اعتماد است؛ wildcard فعال نشده است.
- کنترل مبدأ درخواست‌های تغییردهنده، شامل ورود و refresh، جدا از CORS اجرا می‌شود. مبدأ خارجی، `null` و دامنه مشابه رد می‌شوند. درخواست دارای کوکی بدون Origin باید Referer مورد اعتماد یا بررسی معتبر CSRF داشته باشد.
- پیش‌نویس واقعی ثبت‌نام از حساب قدیمیِ فاقد برخی اطلاعات جدا شده است؛ حساب موجود از پنل به ثبت‌نام پرت نمی‌شود.
- Next.js قبل از انتشار از 16.3.6 به نسخه اصلاح‌شده 16.4.5 ارتقا یافت. `npm audit --omit=dev` برای وابستگی‌های runtime لندینگ، صفر آسیب‌پذیری گزارش کرد. این نتیجه ادعای نبود همه ریسک‌های احتمالی امنیتی نیست.

## اعتبارسنجی

۱۳۰ تست پنل، ۲۴ تست مرتبط بک‌اند/امنیت، ۲ تست لینک لندینگ، ۶ تست ابزار انتشار، بیلدهای Production و بررسی تاریخچه Migration تولید پاس شدند. lint لندینگ خطا نداشت؛ هشدارهای موجود باقی‌اند. Security gate سرور، هشدارهای سازگاری از قبل بررسی‌شده را ثبت کرد و مانع جدیدی نداشت.

مرورگر واقعی با گواهی معتبر و بدون bypass TLS این موارد را روی دامنه‌های واقعی تست کرد: ورود مهمان به لاگین، ورود حساب با رمز، نمایش حساب در لندینگ، تمدید access از refresh، نمایش موبایل، خروج از مبدأ لندینگ، همگام‌شدن نام با focus، و بازگشت از ورود به فرم محافظت‌شده. هیچ OTP یا استعلام هویتی/پستی پولی برای تست Production ارسال نشد. حساب آزمایشی، نشست‌های آن و فایل موقت اطلاعات ورود پس از تست حذف شدند؛ هیچ فایل ملکی یا قرارداد آزمایشی ساخته نشد.

## بازگشت و نگهداری

- Snapshot بک‌اند و دیتابیس: `/var/backups/mlkino/backend-20261105-001-landing`
- بکاپ Nginx قبل از لندینگ: `/var/backups/mlkino/landing-20261105-001/nginx-before.tar.gz`
- پنل قبل: `/var/www/mlkino-frontend/releases/20261104-004-roles`
- پنل فعال: `/var/www/mlkino-frontend/releases/20261105-001-landing`
- لندینگ فعال: `/var/www/mlkino-landing/releases/20261105-001-landing/.next/standalone`

Migration افزایشی `accounts.0014_user_address_source` اعمال شد. بازگشت کد، Migration یا دیتابیس را معکوس نمی‌کند. Secretها، Media و تنظیمات provider سرور حفظ شده‌اند. برای تغییر بعدی دوباره release تازه بسازید؛ فایل فعال را درجا بازنویسی نکنید.
