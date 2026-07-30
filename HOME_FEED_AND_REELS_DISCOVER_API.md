# Home Feed & Reels Discovery API

> **Base URL**: `https://<your-domain>/api`
> **Auth header**: `Authorization: Bearer <accessToken>`

Two new endpoints, both authenticated:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/feed/home` | Instagram-style home screen — your own posts/reels first, then a chronological feed of who you follow |
| `GET /api/reels/discover` | Reels scroll screen — reels from **public accounts only** |

---

## GET `/api/feed/home`

Home screen feed.

- **`page=1`** returns the authenticated user's own recent posts + reels (newest first).
- **`page=2` and beyond** returns posts + reels from accounts the user follows, in chronological order, newest first. Own content is excluded from these pages.
- Client behavior: start at `page=1` on screen load, then increment `page` as the user scrolls to load more (following content).

**Query params**

| Param | Default | Notes |
|-------|---------|-------|
| page | 1 | 1 = own content, 2+ = following content |
| limit | 10 | items per page |

**Request**
```bash
curl "https://your-api-domain/api/feed/home?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"
```

**Response 200 — page 1 (own content)**
```json
{
  "success": true,
  "message": "Home feed fetched",
  "data": {
    "feed": [
      {
        "type": "post",
        "id": "uuid",
        "caption": "sunset today 🌇",
        "createdAt": "2026-07-30T08:00:00.000Z",
        "author": {
          "id": "uuid",
          "username": "you",
          "fullName": "You",
          "profileImage": null
        },
        "media": ["https://cdn.example.com/posts/you_1.jpg"],
        "hashtags": ["sunset"],
        "mentions": [],
        "likeCount": 3,
        "saveCount": 1,
        "hasLiked": false,
        "hasSaved": false,
        "isOwn": true
      }
    ],
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

**Request — next page (following content)**
```bash
curl "https://your-api-domain/api/feed/home?page=2&limit=10" \
  -H "Authorization: Bearer <accessToken>"
```

**Response 200 — page 2+ (following content)**
```json
{
  "success": true,
  "message": "Home feed fetched",
  "data": {
    "feed": [
      {
        "type": "reel",
        "id": "uuid",
        "caption": "Day in my life",
        "createdAt": "2026-07-29T18:00:00.000Z",
        "author": {
          "id": "uuid",
          "username": "friend_username",
          "fullName": "A Friend",
          "profileImage": null
        },
        "videoUrl": "https://cdn.example.com/reels/videos/friend_1.mp4",
        "thumbnailUrl": "https://cdn.example.com/reels/thumbnails/friend_1.jpg",
        "hashtags": [],
        "mentions": [],
        "likeCount": 12,
        "saveCount": 2,
        "hasLiked": false,
        "hasSaved": false,
        "isOwn": false
      }
    ],
    "page": 2,
    "limit": 10,
    "hasMore": true
  }
}
```

> `type` is `"post"` or `"reel"`. Posts include `media[]` (image URLs); reels include `videoUrl`/`thumbnailUrl`. `isOwn` marks whether the item belongs to the viewer.
> `hasMore` on page 1 indicates whether the user follows anyone (i.e. whether page 2 will have content). On page 2+ it reflects normal pagination.

---

## GET `/api/reels/discover`

Reels-only scroll feed, showing content from **public accounts only** (both the reel's own `isPrivate` flag and the author's account-level `isPrivate` must be `false`). Intended for a dedicated reels-browsing screen, separate from the home feed.

**Query params**

| Param | Default |
|-------|---------|
| page | 1 |
| limit | 10 |

**Request**
```bash
curl "https://your-api-domain/api/reels/discover?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"
```

**Response 200**
```json
{
  "success": true,
  "message": "Reels fetched",
  "data": {
    "reels": [
      {
        "id": "uuid",
        "videoUrl": "https://cdn.example.com/reels/videos/u2_123.mp4",
        "thumbnailUrl": "https://cdn.example.com/reels/thumbnails/u2_123.jpg",
        "caption": "check this out",
        "createdAt": "2026-07-30T07:00:00.000Z",
        "author": {
          "id": "uuid",
          "username": "someone_public",
          "fullName": "Someone",
          "profileImage": null
        },
        "hashtags": ["fun"],
        "mentions": [],
        "likeCount": 42,
        "saveCount": 5,
        "hasLiked": false,
        "hasSaved": false
      }
    ],
    "total": 137,
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

---

## Implementation notes

- Route order matters: `GET /api/reels/discover` is registered **before** `GET /api/reels/:id` in `modules/reel/routes/reel.routes.js` so `"discover"` isn't swallowed as a UUID `:id` param.
- Both endpoints reuse the existing batched like/save-count pattern (`Like`/`Save` tables keyed by `contentType`/`contentId`) to avoid N+1 queries — same approach as `GET /api/feed` and `GET /api/users/:id/posts`.
- `/api/feed/home` pagination beyond page 1 uses an in-memory merge of `Post`/`Reel` query results sorted by `createdAt` (fetches a multiple of `limit` from each table, merges, then slices) — the same non-exact-offset approach already used by `GET /api/feed`.
- Files touched:
  - `modules/feed/services/feed.service.js` — added `getHomeFeed`
  - `modules/feed/controllers/feed.controller.js` — added `getHomeFeedController`
  - `modules/feed/routes/feed.routes.js` — added `GET /home`
  - `modules/reel/services/reel.service.js` — added `getPublicReelsFeed`
  - `modules/reel/controllers/reel.controller.js` — added `getPublicReelsController`
  - `modules/reel/routes/reel.routes.js` — added `GET /discover`
