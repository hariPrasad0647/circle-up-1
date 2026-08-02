# CircleUp API

REST API for CircleUp, a social platform supporting posts, reels (short video), stories, real-time chat, follows, comments, likes/saves/shares, and a personalized home feed.

## Tech stack

- **Runtime:** Node.js + Express
- **Database:** MySQL (via Sequelize ORM) — also works against TiDB Cloud
- **Real-time:** Socket.IO (chat)
- **Cache / OTP store:** Redis
- **File storage:** Bunny.net CDN (images/videos uploaded via multer memory storage, then pushed to Bunny)
- **Auth:** JWT (access + refresh tokens), OTP-based signup/login via email (Brevo SMTP)
- **Validation:** express-validator

## Project structure

Feature-module layout — each module owns its routes, controllers, services, models, and validators:

```
modules/
  auth/       signup, OTP verification, login
  user/       profile, follow/unfollow, search, saved content
  post/       image posts, likes/saves/shares, hashtags/mentions
  reel/       short-video posts (same interaction model as posts)
  content/    unified create endpoint — POST /api/content (post OR reel in one call)
  comment/    comments + threaded replies (shared by posts and reels)
  chat/       1:1 conversations, real-time messaging, media messages
  story/      24-hour stories, views, reactions
  feed/       ranked feed + chronological home feed
  community/  (stub, not yet wired up)
  notification/ (stub, not yet wired up)
  search/     (stub — search currently lives in user/chat modules)

middleware/   auth, upload (multer + Bunny CDN), validate, error handling
config/       db, jwt, multer, bunny, redis
utils/        response helpers, shared validators, logger
```

Posts and reels are separate Sequelize models, but every cross-cutting concern (likes, saves, shares, comments) uses a polymorphic `contentType: 'post' | 'reel'` + `contentId` pair, and list/feed responses tag each item with a `type` field so the frontend can render a mixed list.

## Prerequisites

- Node.js 18+
- MySQL (local, e.g. XAMPP) or a TiDB Cloud database
- Redis (for OTP storage)
- A Bunny.net Storage Zone (for file uploads)
- A Brevo (Sendinblue) SMTP account or API key (for OTP emails)

## Setup

```bash
npm install
cp .env.example .env   # fill in the values below
npm run dev             # nodemon, restarts on file change
# or
npm start                # plain node
```

The server connects to the database and runs `sequelize.sync({ alter: true })` on boot, then listens on `PORT` (default `5000`).

## Environment variables

See [.env.example](.env.example) for the full list. Key groups:

| Group | Variables |
|---|---|
| Server | `PORT`, `NODE_ENV` |
| Database | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL` |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| OTP | `OTP_EXPIRES_IN`, `PENDING_SIGNUP_EXPIRES_IN` |
| Email (Brevo) | `BREVO_SMTP_USER`, `BREVO_SMTP_PASS`, `BREVO_API_KEY`, `EMAIL_FROM` |
| Uploads | `MAX_FILE_SIZE` (images, bytes), `MAX_VIDEO_SIZE` (video/reel uploads, bytes) |
| Bunny CDN | `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_PASSWORD`, `BUNNY_STORAGE_ENDPOINT`, `BUNNY_CDN_URL` |
| Client | `CLIENT_URL` |

## API overview

All endpoints are mounted under `/api`. Auth is via `Authorization: Bearer <accessToken>` unless noted otherwise.

| Base path | Purpose |
|---|---|
| `/api/auth` | Signup (OTP), resend/verify OTP, login |
| `/api/users` | Profile, interests, follow/unfollow, followers/following, search, saved posts/reels |
| `/api/posts` | Create/fetch image posts, like/save/share, comments |
| `/api/reels` | Create/fetch reels, like/save/share, comments, public discovery |
| `/api/content` | Single endpoint to create a post (images) or a reel (video) in one call |
| `/api/chat` | Conversations, send/search/delete messages, media upload |
| `/api/feed` | `/feed/home` (own + following, chronological) and `/feed` (ranked/scored) |
| `/api/stories` | Create/view stories, viewers, reactions |

Every response follows the same envelope:
```json
{ "success": true,  "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": [{ "field": "caption", "message": "..." }] }
```

Full endpoint-by-endpoint documentation: [API_DOCS.md](API_DOCS.md) and [HOME_FEED_AND_REELS_DISCOVER_API.md](HOME_FEED_AND_REELS_DISCOVER_API.md). A ready-to-import Postman collection is at [CircleUp.postman_collection.json](CircleUp.postman_collection.json).

## Scripts

| Command | Description |
|---|---|
| `npm start` | Run the server with plain `node` |
| `npm run dev` | Run with `nodemon` (auto-restart on changes) |
