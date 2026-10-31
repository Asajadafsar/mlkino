# انتشار Production ملکینو — بسته 20261031-001

وضعیت: **آماده‌سازی محلی؛ هنوز هیچ انتشار، Migration، Restart یا تغییر Nginx روی Production انجام نشده است.** اجرای بخش‌های نوشتنی این راهنما فقط بعد از تأیید مالک انجام می‌شود.

## نتیجه بررسی واقعی سرور

| مورد | مقدار بررسی‌شده |
|---|---|
| سیستم | Debian 13.7 |
| اتصال | `ssh -p 22 root@212.80.20.75`؛ ورود تعاملی SSH، بدون ذخیره رمز |
| پروژه | `/var/www/mlkino`؛ Git: `a9db304`؛ تغییرات Commitنشده دارد |
| لوکال | بک‌اند `810c6c4`، فرانت `737f9cf`؛ هر دو تغییرات Commitنشده دارند |
| فرانت | Create React App / React Router؛ خروجی static، سرویس Node لازم نیست |
| Python/Django سرور | 3.13.5 / 6.1.2؛ نسخه لوکال Django برابر 6.0.8 است |
| Gunicorn | `gunicorn.service` و `django-app.service` هر دو فعال و روی `/run/gunicorn.sock` |
| مسیر زنده سوکت | Peer PID `147636`، متعلق به `gunicorn.service` در زمان بررسی |
| ASGI | `mlkino-asgi.service`، کاربر `mlkino-asgi`، Uvicorn روی `127.0.0.1:8001` با دو worker |
| Redis | `redis-server.service`؛ Redis channel layer فعال؛ PONG |
| دیتابیس | PostgreSQL موجود روی 127.0.0.1:5432؛ مشخصات و رمز از تنظیمات سرور خوانده می‌شود |
| Nginx API | `/etc/nginx/sites-available/api.mlkino.com` با symlink فعال؛ `/ws/` موجود |
| پنل | DNS روی 212.80.20.75؛ سایت Nginx و پوشه فرانت هنوز وجود ندارند |
| SSL | فقط گواهی `api.mlkino.com` موجود؛ معتبر تا 2027-01-17. گواهی پنل جداگانه لازم است |
| Media / فضا | حدود 436K هنگام بررسی؛ حدود 35G فضای آزاد |

گزارش‌های پالایش‌شده و هش‌ها در `deployment/audit/` هستند؛ مقدار Secretها ثبت نشده است. دریافت متن کامل فایل‌های حساس توسط بازبینی خودکار رد شد؛ مقایسه کد با هش و ساختار AST انجام شد. در فایل‌های بررسی‌شده هیچ کلاس/تابع سطح ماژولِ مختص سرور وجود نداشت که در لوکال حذف شده باشد؛ این جایگزین مرور منطقی کل کد نیست. فایل‌های سفارشی Provider، utils، permissions و تنظیمات اصلی سرور اصلاً در payload انتشار نیستند.

## اختلاف مهم Migration و تنظیمات

سرور تا `accounts.0010` و `panel.0006_panelsettings` پیش رفته است. لوکال از نام متفاوت `panel.0003_support_tickets` استفاده می‌کرد و ساخت PanelSettings را در 0004 قرار داده بود. انتشار مستقیم این تاریخچه ممکن بود به ساخت دوباره جدول‌های موجود منجر شود.

بسته Production تاریخچه دقیق سرور را نگه می‌دارد؛ `0003_supportticket_supportticketmessage_and_more`، 0004، 0005 و 0006 عیناً حفظ می‌شوند. فقط Migration افزایشی `accounts.0011_user_profile_updated_at_accountnotification_and_more` اضافه می‌شود. در تست SQLite ایزوله، کل مسیر اجرا و نبود Migration جدید ناخواسته تأیید شد. **هیچ `--fake`، حذف جدول، flush، reset یا بازسازی دیتابیس اجرا نمی‌شود.**

`mlkino/settings.py` اصلی، `.env`های احتمالی، Media، وenv، `accounts/services/*`، `accounts/utils.py`، `accounts/permissions.py` و URLConf سرور حفظ می‌شوند. فایل جدید `mlkino/production_release.py` فقط روی تنظیمات موجود overlay می‌شود؛ DB/Secret/Redis موجود از همان فایل سرور می‌آیند. Drop-in سرویس فقط settings module را انتخاب می‌کند و ExecStart/User/Group/WorkingDirectory را بازنویسی نمی‌کند.

بررسی `check --deploy` سرور هشدارهای schema مستندات و `security.W004/W008/W009` داشت. Overlay، HTTPS/HSTS کوتاه اولیه و cookieهای امن را فعال می‌کند. برای W009 یک **کلید جدید Django در فایل جداگانه root-private** ساخته می‌شود؛ کلید قبلی برای fallback و امضای JWT موجود حفظ می‌شود تا نشست‌ها قطع نشوند. این انتقال به معنی چرخش کلید JWT نیست؛ چرخش کامل JWT با خروج کاربران، تصمیم جداگانه می‌خواهد.

فقط CSRF cookie با Domain `.mlkino.com` قابل خواندن توسط پنل می‌شود؛ auth/refresh/impersonation همچنان HttpOnly و host-only می‌مانند. Originهای Production حفظ و localhost از overlay حذف می‌شود. هر دو مسیر `/ws/chats/{id}/` و `/ws/inbox/` باید از مسیر فعلی `/ws/` عبور کنند؛ رابط جدید برای پیام‌ها و تماس‌ها از inbox هم استفاده می‌کند.

## برنامه پیشنهادی نیازمند تأیید

1. تهیه بکاپ DB، Media، کد و تنظیمات سیستم در `/var/backups/mlkino` با دسترسی root؛ بررسی checksum و قابلیت خواندن dump.
2. ایجاد مسیر جدید `/var/www/mlkino-frontend/{releases,shared}`؛ هیچ مسیر فعال جابه‌جا نمی‌شود.
3. ایجاد سایت مستقل پنل، دریافت SSL خودش، افزودن HTTP/1.1 به WS موجود و بستن دسترسی عمومی فایل‌های private؛ `nginx -t` قبل از reload.
4. ساخت کلید Django در `/etc/mlkino/release.env`؛ فایل‌های Secret فعلی حفظ می‌شوند.
5. بررسی کد staging روی همان venv سرور، سپس توقف کوتاه API/ASGI برای کپی فایل‌های مجاز و اجرای accounts.0011. سرویس تکراری `django-app.service` متوقف/غیرفعال می‌شود ولی unit آن حذف نمی‌شود؛ Gunicorn واقعی و ASGI با تنظیمات موجود بالا می‌آیند. Redis Restart نمی‌شود.
6. انتشار مستقل فرانت با تغییر اتمیک symlink و تست واقعی. برای تغییر نسخه static نیازی به Restart/Reload سرویس نیست.
7. تکمیل `PRODUCTION_CHECKLIST.md` و نگهداری نسخه قبلی برای Rollback.

اگر مالک توقف/غیرفعال‌کردن سرویس تکراری یا ایجاد کلید جداگانه را تأیید نکند، انتشار بک‌اند در guard متوقف می‌ماند. نسخه‌های نصب‌شده روی سرور ثابت می‌مانند؛ اسکریپت هیچ `pip install` یا upgrade خودکار ندارد.

## ساخت محلی و انتقال بعد از تأیید

```bash
cd /Users/sajad/Desktop/mlkino/mlkino
REACT_APP_API_URL=https://api.mlkino.com \
REACT_APP_WS_URL=wss://api.mlkino.com \
GENERATE_SOURCEMAP=false npm --prefix frontend run build
# برای انتشار بعدی شناسه جدید بدهید؛ پوشه release موجود بازنویسی نمی‌شود.
python3 deployment/prepare-release.py --release 20261031-002
python3 deployment/test-release-migrations.py deployment/artifacts/20261031-002
```

بسته آماده این مرحله در `deployment/artifacts/20261031-001/` است: `backend.tar.gz`، `frontend.tar.gz`، `manifest.json`، checksumها، گزارش تغییرات و بسته ابزار. محتوای Worktree واقعی hash شده؛ Commit یا Push انجام نشده است. هیچ settings.py، دیتابیس، Media، venv یا رمز SSH داخل release نیست.

فقط بعد از تأیید و با پرامپت امن SSH:
```bash
ssh -p 22 root@212.80.20.75 'install -d -m 700 /root/mlkino-release-tools /root/mlkino-releases/20261031-001'
scp -P 22 deployment/artifacts/20261031-001/{backend.tar.gz,frontend.tar.gz,manifest.json,SHA256SUMS} root@212.80.20.75:/root/mlkino-releases/20261031-001/
scp -P 22 deployment/artifacts/20261031-001/deployment-tools.tar.gz root@212.80.20.75:/root/mlkino-release-tools/
ssh -p 22 root@212.80.20.75
```

بقیه دستورات روی سرور، **بعد از تأیید صریح**:
```bash
umask 077
cd /root/mlkino-release-tools
tar -xzf deployment-tools.tar.gz
cp deployment/deploy.env.example /root/mlkino-deploy.env
chmod 600 /root/mlkino-deploy.env
# فایل را مرور کنید و فقط در صورت تأیید مالک، gateها را YES کنید:
# MLKINO_APPROVED=YES
# MLKINO_MIGRATIONS_APPROVED=YES
# MLKINO_DUAL_GUNICORN_REVIEWED=YES
# MLKINO_DUPLICATE_ACTION=stop-disable-django-app
set -a
. /root/mlkino-deploy.env
set +a
cd /root/mlkino-releases/20261031-001
sha256sum -c SHA256SUMS
cd /root/mlkino-release-tools
export MLKINO_BACKUP_DIR=/var/backups/mlkino/predeploy-20261031-001
python3 deployment/runtime.py backend-backup "$MLKINO_BACKUP_DIR"
```

این بکاپ روی سرور می‌ماند؛ به Git، وب‌روت یا سیستم محلی منتقل نمی‌شود. کپی خارج سرور و تمرین Restore فقط با مقصد امن و تأیید جداگانه انجام شود. `pg_restore --list` تنها صحت ساختاری dump را می‌سنجد، نه Restore کامل.

### SSL و Nginx پنل

```bash
python3 deployment/configure-nginx.py bootstrap
# ایمیل واقعی مسئول سرور را وارد کنید؛ ایمیل حدس زده نمی‌شود.
read -r -p 'ACME contact email: ' ACME_EMAIL
certbot certonly --webroot \
  -w /var/www/mlkino-frontend/shared/acme \
  -d panel.mlkino.com --agree-tos -m "$ACME_EMAIL" --no-eff-email
python3 deployment/configure-nginx.py activate
```

اسکریپت از فایل API واقعی موجود استفاده می‌کند و فقط WS و محافظت private media را تغییر می‌دهد. اگر fingerprint یا شکل block تغییر کرده باشد، متوقف می‌شود. تنظیم دامنه‌های دیگر و گواهی API جایگزین نمی‌شوند. هر بار syntax check پیش از reload است. اگر مرحله Nginx شکست بخورد، فایل‌ها به وضعیت قبل بازمی‌گردند؛ برای حالت مبهم، ابتدا `nginx -t` و سپس reload بررسی‌شده انجام دهید.

### کلید جداگانه و Backend

```bash
python3 - <<'PY'
import os, pathlib, secrets
os.umask(0o077)
folder=pathlib.Path('/etc/mlkino');folder.mkdir(mode=0o700,exist_ok=True)
path=folder/'release.env'
with path.open('x') as f:
    f.write('MLKINO_DJANGO_SECRET_KEY='+secrets.token_urlsafe(64)+'\n')
os.chmod(path,0o600)
print('Root-private release environment created; value not displayed.')
PY
./deploy-backend.sh /root/mlkino-deploy.env /root/mlkino-releases/20261031-001
```

`open('x')` از بازنویسی فایل موجود جلوگیری می‌کند. اگر فایل از قبل هست، از همان نسخه بررسی‌شده استفاده کنید و آن را کورکورانه حذف نکنید. اسکریپت قبل از فعال‌سازی، وابستگی‌ها/هش‌ها، check، check --deploy، gate هشدارهای امنیتی و migration plan را بررسی می‌کند. خطای فعال‌سازی باعث تلاش برای Rollback کد می‌شود؛ DB هرگز معکوس نمی‌شود. هشدارهای قدیمی تولید schema ثبت می‌شوند و با هشدارهای امنیتی یکسان در نظر گرفته نمی‌شوند.

### Frontend

```bash
./deploy-frontend.sh /root/mlkino-deploy.env /root/mlkino-releases/20261031-001
```

حلقه نسخه‌ها به شکل `current -> releases/20261031-001` است. اسکریپت هیچ release قبلی را حذف نمی‌کند و اگر current پوشه واقعی باشد به‌جای بازنویسی متوقف می‌شود. صحت پاسخ index.html سرو‌شده با hash release تطبیق داده می‌شود.

## Rollback مستقل

```bash
# مقدار نسخه قبلی را از گزارش موفق انتشار / shared/release-state بخوانید؛ حدس نزنید.
./rollback-frontend.sh /root/mlkino-deploy.env /var/www/mlkino-frontend/releases/PREVIOUS_VERIFIED_RELEASE
./rollback-backend.sh /root/mlkino-deploy.env /var/backups/mlkino/backend-20261031-001
```

Rollback بک‌اند فقط فایل‌های کد قبلی و drop-in/state سرویس را برمی‌گرداند؛ Migration افزایشی، DB، Media، فایل settings.py و Secretها دست‌نخورده می‌مانند. بازگشت به قبل از رفع سرویس تکراری، همان وضعیت دو سرویس قبلی را برمی‌گرداند؛ این محدودیت آگاهانه در snapshot ثبت می‌شود. Restore دیتابیس، reverse migration و حذف اطلاعات هیچ‌کدام خودکار نیستند.

برای برگشت پیکربندی Nginx، فایل‌های `api.before`/`panel.before` همان مرحله داخل بکاپ بررسی و با فایل فعال مقایسه شوند؛ سپس `nginx -t` و reload. site جدید پنل فقط با تأیید حذف/غیرفعال شود. گواهی‌های SSL حذف نمی‌شوند.

## منابع فنی

- [Django deployment checklist](https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/)
- [Django proxy/HTTPS settings](https://docs.djangoproject.com/en/6.1/ref/settings/#secure-proxy-ssl-header)
- [Channels production deployment](https://channels.readthedocs.io/en/stable/deploying.html)
- [Channels Redis layer](https://channels.readthedocs.io/en/latest/topics/channel_layers.html)
