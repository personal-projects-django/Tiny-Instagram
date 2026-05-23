# TinyInstagram

TinyInstagram is a full-stack social media application inspired by Instagram. The backend is built with Django REST Framework, and the frontend is built with React, TypeScript, Vite, and Tailwind CSS. The project includes authentication, user profiles, posts, likes, comments, saved posts, follow requests, stories, notifications, and real-time chat over WebSockets.

## Project Screenshots

The screenshots below are loaded from `media/Pictures from the project` inside this repository.

<p align="center">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-26-42.png" alt="TinyInstagram screenshot 1" width="48%">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-28-52.png" alt="TinyInstagram screenshot 2" width="48%">
</p>

<p align="center">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-29-23.png" alt="TinyInstagram screenshot 3" width="48%">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-29-28.png" alt="TinyInstagram screenshot 4" width="48%">
</p>

<p align="center">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-30-04.png" alt="TinyInstagram screenshot 5" width="48%">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-30-46.png" alt="TinyInstagram screenshot 6" width="48%">
</p>

<p align="center">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-31-09.png" alt="TinyInstagram screenshot 7" width="48%">
  <img src="Pictures from the project/Screenshot from 2026-05-21 00-31-27.png" alt="TinyInstagram screenshot 8" width="48%">
</p>

## Features

- JWT-based register, login, logout, and token refresh flow
- Email OTP verification for new accounts
- Password reset, password change, and account deletion
- Custom user model with email login
- User profile with avatar, bio, first name, last name, age, and private account support
- User search and public profile pages
- Post creation with multiple media files
- Post visibility levels: public, followers, and private
- Feed, explore, user posts, post detail, and infinite scroll in the frontend
- Likes, comments, comment replies, comment deletion, and disabled comments
- Saved posts and a dedicated saved posts page
- Follow and unfollow flow
- Follow requests for private accounts
- Story creation with image or video
- 24-hour story expiration
- Story viewers, story likes, and story replies
- Scheduled cleanup of expired stories with Celery Beat
- Notifications for likes, comments, follows, follow requests, stories, and messages
- Real-time chat rooms with WebSocket support
- Private rooms, groups, and channels
- Text, file, image, video, audio, voice, sticker, GIF, and location messages
- Message read receipts, reactions, edit history, delete options, pinning, search, and file download
- Modern React frontend with React Query, Zustand, Radix UI, Tailwind CSS, i18n, and Lucide icons

## Tech Stack

### Backend

- Python
- Django 4.2
- Django REST Framework
- Simple JWT
- PostgreSQL
- Redis
- Django Channels
- Daphne
- Celery
- django-celery-beat
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
- React Hook Form
- Zod
- Radix UI
- Lucide React
- Framer Motion
- i18next

## Project Structure

```text
maktab119-TinyInstagram/
├── account/          # Custom user, OTP, profile, and auth APIs
├── post/             # Posts, post media, comments, likes, and saved posts
├── follow/           # Follow, unfollow, and follow request logic
├── story/            # Stories, likes, replies, viewers, and story cleanup task
├── notification/     # Generic notifications for project events
├── chat/             # Rooms, messages, stickers, WebSocket consumer, and chat APIs
├── src/              # Django settings, URLs, ASGI/WSGI, Celery, and pagination
├── frontend/         # React/Vite frontend application
├── media/            # Uploaded files and project screenshots
├── static/           # Django static CSS and assets
└── templates/        # Older Django template pages
```

## Main Data Models

### Account

- `User`: Custom user model. Email is used as the login field. It also stores username, phone number, verification status, privacy status, and staff/active flags.
- `OTP`: One-time email verification code that expires after three minutes.
- `Profile`: Public profile information such as avatar, bio, first name, last name, and age.

### Post

- `Post`: Stores owner, caption, visibility, active status, comment settings, and timestamps.
- `PostMedia`: Stores post images and videos with thumbnail, order, dimensions, duration, file size, MIME type, and processing status.
- `Comment`: Supports normal comments and nested replies.
- `Like`: Keeps one like per user per post.
- `SavedPost`: Keeps one saved record per user per post.
- `CommentLike`: Keeps one reaction per user per comment.

### Follow

- `Follow`: Stores follower and following relationships with a unique constraint.
- `FollowRequest`: Handles pending, accepted, and rejected follow requests.

### Story

- `Story`: Stores image/video story content, caption, viewers, expiration time, and creation time.
- `StoryLike`: Stores story reactions.
- `StoryReply`: Stores private replies to stories.

### Notification

- `Notification`: Uses a generic relation so notifications can point to posts, comments, stories, messages, and other objects.

### Chat

- `Room`: Supports private chats, groups, and channels.
- `RoomMember`: Stores membership and role per user in a room.
- `Message`: Supports many message types, replies, forwarded objects, attachments, location, link preview metadata, and status fields.
- `MessageRead`: Tracks who has read a message.
- `MessageReaction`: Stores emoji reactions on messages.
- `MessageEditHistory`: Stores message edit history.
- `DeletedMessageForUser`: Supports deleting a message only for one user.
- `StickerPack`, `Sticker`, and `UserStickerPack`: Handle sticker packs and user-installed sticker libraries.

## API Overview

All backend endpoints are mounted under `/api/`.

### Account Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/account/register/` | Register a new user |
| `POST` | `/api/account/verify-otp/` | Verify the OTP code |
| `POST` | `/api/account/resend-otp/` | Resend the OTP code |
| `POST` | `/api/account/login/` | Log in and receive JWT tokens |
| `POST` | `/api/account/logout/` | Log out |
| `POST` | `/api/account/token/refresh/` | Refresh the access token |
| `POST` | `/api/account/password-reset/` | Request password reset |
| `POST` | `/api/account/password-confirm/` | Set a new password |
| `POST` | `/api/account/password-change/` | Change the current password |
| `DELETE` | `/api/account/delete-account/` | Delete the current account |
| `GET/PATCH` | `/api/account/me/` | Read or update the current profile |
| `GET` | `/api/account/search/` | Search users |
| `GET` | `/api/account/<username>/` | Read a public profile |

### Post Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/post/` | Create a post |
| `GET` | `/api/post/feed/` | Get the feed |
| `GET` | `/api/post/explore/` | Get explore posts |
| `GET` | `/api/post/saved/` | Get saved posts |
| `GET` | `/api/post/user/<username>/` | Get posts by username |
| `GET/PATCH/DELETE` | `/api/post/<id>/` | Read, update, or delete a post |
| `POST` | `/api/post/<post_id>/like/` | Toggle post like |
| `GET/POST` | `/api/post/<post_id>/comments/` | List or create comments |
| `DELETE` | `/api/post/comments/<comment_id>/delete/` | Delete a comment |
| `POST` | `/api/post/<post_id>/save/` | Toggle saved post |

### Follow Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/follow/suggested/` | Get suggested users |
| `GET/POST` | `/api/follow/requests/` | List or create follow requests |
| `PATCH/DELETE` | `/api/follow/requests/<request_id>/` | Manage a follow request |
| `POST` | `/api/follow/<username>/follow/` | Follow or unfollow a user |
| `GET` | `/api/follow/<username>/followers/` | List followers |
| `GET` | `/api/follow/<username>/following/` | List following users |

### Story Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/story/` | Get story feed |
| `GET` | `/api/story/me/` | Get my stories |
| `GET` | `/api/story/archive/` | Get my story archive |
| `GET` | `/api/story/replies/` | Get replies to my stories |
| `POST` | `/api/story/create/` | Create a story |
| `GET` | `/api/story/<story_id>/` | Read story details |
| `DELETE` | `/api/story/<story_id>/delete/` | Delete a story |
| `POST` | `/api/story/<story_id>/like/` | Like or react to a story |
| `POST` | `/api/story/<story_id>/reply/` | Reply to a story |
| `GET` | `/api/story/<story_id>/viewers/` | List story viewers |
| `GET` | `/api/story/<story_id>/likers/` | List story likers |

### Notification Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/notification/` | List notifications |
| `GET` | `/api/notification/unread-count/` | Get unread count |
| `POST` | `/api/notification/read-all/` | Mark all notifications as read |
| `POST` | `/api/notification/<id>/read/` | Mark one notification as read |

### Chat Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET/POST` | `/api/chat/rooms/` | List or create rooms |
| `GET/PATCH/DELETE` | `/api/chat/rooms/<id>/` | Read or manage a room |
| `GET/POST` | `/api/chat/rooms/<room_id>/members/` | List or manage room members |
| `GET` | `/api/chat/rooms/<room_id>/messages/` | List room messages |
| `GET` | `/api/chat/rooms/<room_id>/messages/search/` | Search messages |
| `POST` | `/api/chat/messages/send/` | Send a message |
| `PATCH` | `/api/chat/messages/<message_id>/edit/` | Edit a message |
| `DELETE` | `/api/chat/messages/<message_id>/delete/` | Delete a message |
| `POST` | `/api/chat/messages/<message_id>/pin/` | Pin or unpin a message |
| `POST` | `/api/chat/messages/<message_id>/read/` | Mark a message as read |
| `POST` | `/api/chat/messages/<message_id>/reaction/` | React to a message |
| `GET` | `/api/chat/messages/<message_id>/download/` | Download a message file |
| `GET` | `/api/chat/stickers/` | List sticker packs |
| `POST` | `/api/chat/stickers/<pack_id>/install/` | Install a sticker pack |

## WebSocket

```text
ws://127.0.0.1:8000/ws/chat/<room_id>/
```

WebSocket traffic is routed through Django Channels in `src/asgi.py`. The chat connection uses `JWTAuthMiddleware`.

## Frontend Routes

| Route | Page |
| --- | --- |
| `/login` | Login |
| `/register` | Register |
| `/forgot` | Forgot password |
| `/` | Main feed |
| `/explore` | Explore |
| `/me` | My profile |
| `/profile/:username` | Public profile |
| `/notifications` | Notifications |
| `/stories/create` | Create story |
| `/stories/:username` | Story viewer |
| `/chat` | Chat list |
| `/chat/:roomId` | Chat room |
| `/post/:id` | Post detail |
| `/saved` | Saved posts |

## Requirements

- Python 3.10 or newer
- Node.js and npm
- PostgreSQL
- Redis

## Environment Variables

Create a `.env` file in the project root:

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

## Backend Setup

```bash
cd /home/kianjavk/maktab119-TinyInstagram
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

On Windows, activate the virtual environment with:

```bash
.venv\Scripts\activate
```

## Frontend Setup

```bash
cd /home/kianjavk/maktab119-TinyInstagram/frontend
npm install
```

## Running the Project

Start Redis:

```bash
sudo systemctl start redis-server
redis-cli ping
```

Start the Celery worker:

```bash
cd /home/kianjavk/maktab119-TinyInstagram
source .venv/bin/activate
celery -A src worker -l info
```

Start Celery Beat for scheduled tasks:

```bash
cd /home/kianjavk/maktab119-TinyInstagram
source .venv/bin/activate
celery -A src beat -l info
```

Start the ASGI backend with Daphne:

```bash
cd /home/kianjavk/maktab119-TinyInstagram
source .venv/bin/activate
daphne -b 0.0.0.0 -p 8000 src.asgi:application
```

Start the frontend:

```bash
cd /home/kianjavk/maktab119-TinyInstagram/frontend
npm run dev
```

Main URLs:

```text
Frontend: http://localhost:5173/
Django Admin: http://127.0.0.1:8000/admin/
API Base: http://127.0.0.1:8000/api/
```

## Scripts

Root project:

```bash
npm run dev
```

This watches the Django-template Tailwind input file and writes the output to `static/css/style.css`.

Frontend project:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Implementation Notes

- The backend uses PostgreSQL by default. The SQLite configuration is commented out in `src/settings.py`.
- Django REST Framework uses JWT authentication by default.
- Pagination is configured through `src.pagination.StandardPagination`.
- CORS allows `localhost:5173`, `localhost:5174`, and `localhost:3000`.
- Redis is used for Channels, cache, and Celery.
- If `channels_redis` is not installed, the app falls back to `InMemoryChannelLayer`.
- Stories are controlled by `expires_at` and cleaned by `story.tasks.delete_expired_stories` every hour.
- The frontend uses `/api` as the base API URL.
- `frontend/src/api/client.ts` attaches JWT access tokens to requests and attempts token refresh after a `401` response.

## License

This project includes a `LICENSE` file. See that file for license details.
