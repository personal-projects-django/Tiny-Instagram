# TinyInstagram

TinyInstagram یک شبکه اجتماعی کوچک شبیه Instagram است که با Django REST Framework در backend و React/Vite در frontend ساخته شده است. پروژه فقط یک CRUD ساده نیست؛ احراز هویت JWT، پروفایل کاربر، پست چندرسانه‌ای، کامنت، لایک، ذخیره پست، فالو و درخواست فالو، استوری ۲۴ ساعته، اعلان‌ها و چت real-time با WebSocket را پوشش می‌دهد.

## تصاویر پروژه

تصاویر زیر از مسیر `media/Pictures from the project` داخل خود پروژه نمایش داده می‌شوند:

| Screenshot | Screenshot |
| --- | --- |
| ![TinyInstagram screenshot 1](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-26-42.png) | ![TinyInstagram screenshot 2](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-28-52.png) |
| ![TinyInstagram screenshot 3](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-29-23.png) | ![TinyInstagram screenshot 4](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-29-28.png) |
| ![TinyInstagram screenshot 5](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-30-04.png) | ![TinyInstagram screenshot 6](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-30-46.png) |
| ![TinyInstagram screenshot 7](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-31-09.png) | ![TinyInstagram screenshot 8](media/Pictures%20from%20the%20project/Screenshot%20from%202026-05-21%2000-31-27.png) |

## قابلیت‌ها

- ثبت‌نام، ورود، خروج و refresh token با JWT
- تایید حساب با OTP ایمیلی
- ریست رمز عبور، تغییر رمز و حذف حساب
- پروفایل اختصاصی با avatar، bio، نام، نام خانوادگی و private account
- جستجوی کاربران و مشاهده پروفایل عمومی
- ایجاد پست با چند رسانه، caption و سطح visibility
- feed، explore، پست‌های کاربر، جزئیات پست و infinite scroll در frontend
- لایک، کامنت، reply کامنت، حذف کامنت و غیرفعال کردن کامنت
- ذخیره کردن پست‌ها و صفحه Saved
- فالو، آنفالو، لیست followers/following و درخواست فالو برای حساب‌های خصوصی
- استوری با تصویر یا ویدیو، انقضای ۲۴ ساعته، viewer list، like و reply
- حذف خودکار استوری‌های منقضی‌شده با Celery Beat
- notification برای لایک، کامنت، فالو، درخواست فالو، استوری و پیام
- chat با room خصوصی، گروه، کانال، پیام متنی/فایل/تصویر/ویدیو/صدا/sticker/location
- WebSocket chat با Django Channels و احراز هویت JWT
- واکنش به پیام، read receipt، ویرایش پیام، حذف پیام، pin، search و download فایل پیام
- frontend مدرن با React, TypeScript, Tailwind, React Query, Zustand, Radix UI و i18n

## تکنولوژی‌ها

### Backend

- Python
- Django 4.2
- Django REST Framework
- Simple JWT
- PostgreSQL
- Redis
- Django Channels
- Daphne
- Celery و django-celery-beat
- django-redis
- django-cors-headers
- Pillow

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack React Query
- Zustand
- Axios
- React Hook Form و Zod
- Radix UI
- Lucide React
- Framer Motion
- i18next

## معماری پروژه

```text
maktab119-TinyInstagram/
├── account/          # کاربر سفارشی، OTP، پروفایل، auth API
├── post/             # پست، رسانه پست، کامنت، لایک، ذخیره پست
├── follow/           # follow/unfollow و follow request
├── story/            # استوری، like، reply، viewer و task حذف استوری
├── notification/     # اعلان‌های generic برای رویدادهای مختلف
├── chat/             # room، message، sticker، WebSocket consumer و chat API
├── src/              # تنظیمات اصلی Django، ASGI/WSGI، urls، celery، pagination
├── frontend/         # اپ React/Vite
├── media/            # فایل‌های آپلود شده کاربران و نمونه تصاویر پروژه
├── static/           # CSS و assetهای static سمت Django
└── templates/        # قالب‌های قدیمی Django template
```

## مدل‌های اصلی

### Account

- `User`: مدل کاربر سفارشی با email به عنوان `USERNAME_FIELD`، username یکتا، phone، وضعیت verified/private/active/staff و متد تولید JWT.
- `OTP`: کد تایید ۶ رقمی برای email که بعد از ۳ دقیقه منقضی می‌شود.
- `Profile`: اطلاعات عمومی کاربر مثل bio، avatar، first name، last name و age.

### Post

- `Post`: مالک پست، caption، visibility شامل `public`، `followers` و `private`، وضعیت active و comments disabled.
- `PostMedia`: فایل‌های image/video هر پست با thumbnail، ترتیب، ابعاد، duration، size و mime type.
- `Comment`: کامنت و reply تودرتو با وضعیت approval.
- `Like`: لایک یکتای کاربر روی پست.
- `SavedPost`: ذخیره پست توسط کاربر.
- `CommentLike`: واکنش کاربر به کامنت.

### Follow

- `Follow`: رابطه follower/following با constraint یکتا.
- `FollowRequest`: درخواست فالو با وضعیت `pending`، `accepted` یا `rejected`.

### Story

- `Story`: استوری تصویر/ویدیو با caption، viewer list، زمان انقضا و محاسبه active بودن.
- `StoryLike`: reaction روی استوری.
- `StoryReply`: reply خصوصی به صاحب استوری.

### Notification

- `Notification`: اعلان generic با `GenericForeignKey` برای اتصال به Post، Comment، Story، Message و سایر آبجکت‌ها.

### Chat

- `Room`: چت خصوصی، گروه یا کانال.
- `RoomMember`: عضویت کاربر در room با نقش owner/admin/member/subscriber.
- `Message`: پیام با typeهای text، image، video، audio، file، sticker، gif، location و voice.
- `MessageRead`: read receipt.
- `MessageReaction`: واکنش ایموجی روی پیام.
- `MessageEditHistory`: تاریخچه ویرایش پیام.
- `DeletedMessageForUser`: حذف پیام فقط برای یک کاربر.
- `StickerPack`، `Sticker` و `UserStickerPack`: مدیریت stickerها.

## API اصلی

تمام endpointهای backend زیر prefix `/api/` قرار دارند.

### Account

| Method | Endpoint | توضیح |
| --- | --- | --- |
| `POST` | `/api/account/register/` | ثبت‌نام کاربر |
| `POST` | `/api/account/verify-otp/` | تایید OTP |
| `POST` | `/api/account/resend-otp/` | ارسال دوباره OTP |
| `POST` | `/api/account/login/` | ورود و دریافت JWT |
| `POST` | `/api/account/logout/` | خروج |
| `POST` | `/api/account/token/refresh/` | refresh کردن access token |
| `POST` | `/api/account/password-reset/` | درخواست ریست رمز |
| `POST` | `/api/account/password-confirm/` | ثبت رمز جدید |
| `POST` | `/api/account/password-change/` | تغییر رمز کاربر لاگین‌شده |
| `DELETE` | `/api/account/delete-account/` | حذف حساب |
| `GET/PATCH` | `/api/account/me/` | دریافت یا ویرایش پروفایل من |
| `GET` | `/api/account/search/` | جستجوی کاربران |
| `GET` | `/api/account/<username>/` | پروفایل عمومی |

### Post

| Method | Endpoint | توضیح |
| --- | --- | --- |
| `POST` | `/api/post/` | ایجاد پست |
| `GET` | `/api/post/feed/` | feed کاربران دنبال‌شده |
| `GET` | `/api/post/explore/` | explore |
| `GET` | `/api/post/saved/` | پست‌های ذخیره‌شده |
| `GET` | `/api/post/user/<username>/` | پست‌های یک کاربر |
| `GET/PATCH/DELETE` | `/api/post/<id>/` | جزئیات، ویرایش یا حذف پست |
| `POST` | `/api/post/<post_id>/like/` | toggle لایک |
| `GET/POST` | `/api/post/<post_id>/comments/` | لیست یا ایجاد کامنت |
| `DELETE` | `/api/post/comments/<comment_id>/delete/` | حذف کامنت |
| `POST` | `/api/post/<post_id>/save/` | toggle ذخیره پست |

### Follow

| Method | Endpoint | توضیح |
| --- | --- | --- |
| `GET` | `/api/follow/suggested/` | کاربران پیشنهادی |
| `GET/POST` | `/api/follow/requests/` | لیست یا ایجاد درخواست فالو |
| `PATCH/DELETE` | `/api/follow/requests/<request_id>/` | مدیریت درخواست فالو |
| `POST` | `/api/follow/<username>/follow/` | follow/unfollow |
| `GET` | `/api/follow/<username>/followers/` | لیست followers |
| `GET` | `/api/follow/<username>/following/` | لیست following |

### Story

| Method | Endpoint | توضیح |
| --- | --- | --- |
| `GET` | `/api/story/` | feed استوری |
| `GET` | `/api/story/me/` | استوری‌های من |
| `GET` | `/api/story/archive/` | آرشیو استوری‌های من |
| `GET` | `/api/story/replies/` | replyهای استوری‌های من |
| `POST` | `/api/story/create/` | ایجاد استوری |
| `GET` | `/api/story/<story_id>/` | جزئیات استوری |
| `DELETE` | `/api/story/<story_id>/delete/` | حذف استوری |
| `POST` | `/api/story/<story_id>/like/` | like/reaction استوری |
| `POST` | `/api/story/<story_id>/reply/` | reply به استوری |
| `GET` | `/api/story/<story_id>/viewers/` | بینندگان استوری |
| `GET` | `/api/story/<story_id>/likers/` | لایک‌کنندگان استوری |

### Notification

| Method | Endpoint | توضیح |
| --- | --- | --- |
| `GET` | `/api/notification/` | لیست اعلان‌ها |
| `GET` | `/api/notification/unread-count/` | تعداد اعلان خوانده‌نشده |
| `POST` | `/api/notification/read-all/` | خواندن همه اعلان‌ها |
| `POST` | `/api/notification/<id>/read/` | خواندن یک اعلان |

### Chat

| Method | Endpoint | توضیح |
| --- | --- | --- |
| `GET/POST` | `/api/chat/rooms/` | لیست یا ایجاد room |
| `GET/PATCH/DELETE` | `/api/chat/rooms/<id>/` | جزئیات یا مدیریت room |
| `GET/POST` | `/api/chat/rooms/<room_id>/members/` | اعضای room |
| `GET` | `/api/chat/rooms/<room_id>/messages/` | پیام‌های room |
| `GET` | `/api/chat/rooms/<room_id>/messages/search/` | جستجوی پیام‌ها |
| `POST` | `/api/chat/messages/send/` | ارسال پیام |
| `PATCH` | `/api/chat/messages/<message_id>/edit/` | ویرایش پیام |
| `DELETE` | `/api/chat/messages/<message_id>/delete/` | حذف پیام |
| `POST` | `/api/chat/messages/<message_id>/pin/` | pin/unpin پیام |
| `POST` | `/api/chat/messages/<message_id>/read/` | ثبت خوانده‌شدن پیام |
| `POST` | `/api/chat/messages/<message_id>/reaction/` | reaction روی پیام |
| `GET` | `/api/chat/messages/<message_id>/download/` | دانلود فایل پیام |
| `GET` | `/api/chat/stickers/` | لیست sticker packها |
| `POST` | `/api/chat/stickers/<pack_id>/install/` | نصب sticker pack |

### WebSocket

```text
ws://127.0.0.1:8000/ws/chat/<room_id>/
```

اتصال WebSocket از `JWTAuthMiddleware` استفاده می‌کند و توسط Django Channels در `src/asgi.py` route می‌شود.

## صفحات frontend

| Route | صفحه |
| --- | --- |
| `/login` | ورود |
| `/register` | ثبت‌نام |
| `/forgot` | فراموشی رمز |
| `/` | feed اصلی |
| `/explore` | Explore |
| `/me` | پروفایل من |
| `/profile/:username` | پروفایل عمومی |
| `/notifications` | اعلان‌ها |
| `/stories/create` | ایجاد استوری |
| `/stories/:username` | مشاهده استوری |
| `/chat` | لیست گفتگوها |
| `/chat/:roomId` | room چت |
| `/post/:id` | جزئیات پست |
| `/saved` | پست‌های ذخیره‌شده |

## پیش‌نیازها

- Python 3.10 یا جدیدتر
- Node.js و npm
- PostgreSQL
- Redis

## متغیرهای محیطی

یک فایل `.env` در ریشه پروژه نیاز است. مقدارهای واقعی را مطابق سیستم خودتان قرار دهید:

```env
SECRET_KEY=your-secret-key
DEBUG=True

DB_NAME=tinyinstagram
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=127.0.0.1
DB_PORT=5432

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password
```

## نصب backend

```bash
cd /home/kianjavk/maktab119-TinyInstagram
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

در ویندوز فعال‌سازی virtualenv معمولاً به این شکل است:

```bash
.venv\Scripts\activate
```

## نصب frontend

```bash
cd /home/kianjavk/maktab119-TinyInstagram/frontend
npm install
```

## اجرای پروژه در حالت توسعه

ابتدا Redis را اجرا کنید:

```bash
sudo systemctl start redis-server
redis-cli ping
```

Celery worker:

```bash
cd /home/kianjavk/maktab119-TinyInstagram
source .venv/bin/activate
celery -A src worker -l info
```

Celery Beat برای taskهای زمان‌بندی‌شده مثل حذف استوری‌های منقضی:

```bash
cd /home/kianjavk/maktab119-TinyInstagram
source .venv/bin/activate
celery -A src beat -l info
```

Backend ASGI با Daphne:

```bash
cd /home/kianjavk/maktab119-TinyInstagram
source .venv/bin/activate
daphne -b 0.0.0.0 -p 8000 src.asgi:application
```

Frontend:

```bash
cd /home/kianjavk/maktab119-TinyInstagram/frontend
npm run dev
```

آدرس‌های اصلی:

```text
Frontend: http://localhost:5173/
Django Admin: http://127.0.0.1:8000/admin/
API Base: http://127.0.0.1:8000/api/
```

## اسکریپت‌ها

در ریشه پروژه:

```bash
npm run dev
```

این دستور Tailwind مربوط به templateهای Django را watch می‌کند و خروجی را در `static/css/style.css` می‌سازد.

در `frontend/`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## نکات پیاده‌سازی

- backend به صورت پیش‌فرض از PostgreSQL استفاده می‌کند؛ تنظیم SQLite در `src/settings.py` کامنت شده است.
- `REST_FRAMEWORK` احراز هویت پیش‌فرض را JWT قرار داده و pagination سفارشی از `src.pagination.StandardPagination` استفاده می‌کند.
- CORS برای `localhost:5173`، `localhost:5174` و `localhost:3000` فعال است.
- Redis هم برای Channels و هم برای cache/Celery استفاده می‌شود.
- اگر پکیج `channels_redis` موجود نباشد، پروژه به `InMemoryChannelLayer` fallback می‌کند.
- استوری‌ها با `expires_at` کنترل می‌شوند و task `story.tasks.delete_expired_stories` هر ساعت اجرا می‌شود.
- frontend از `/api` به عنوان base URL استفاده می‌کند و Vite باید requestها را به backend proxy کند.
- interceptor در `frontend/src/api/client.ts` توکن JWT را به requestها اضافه می‌کند و در پاسخ 401 تلاش می‌کند access token را refresh کند.

## License

این پروژه فایل `LICENSE` دارد و متن license در همان فایل قابل مشاهده است.
