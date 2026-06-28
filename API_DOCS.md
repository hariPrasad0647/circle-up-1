# CircleUp API Documentation

> **Base URL**: `https://<your-domain>/api`  
> **Content-Type**: `application/json` (unless noted as multipart/form-data)  
> **Auth header**: `Authorization: Bearer <accessToken>`

---

## Global Response Format

All endpoints return JSON with this structure:

**Success**
```json
{
  "success": true,
  "message": "string",
  "data": { ... }
}
```

**Error**
```json
{
  "success": false,
  "message": "string",
  "errors": [ ... ]
}
```

---

## Error Reference

| Status | Meaning |
|--------|---------|
| 401 | Missing or invalid/expired token |
| 403 | Forbidden — action not allowed |
| 404 | Resource not found |
| 409 | Conflict — duplicate resource |
| 422 | Validation failed |
| 500 | Internal server error |

**422 Validation Error body:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "msg": "error message",
      "path": "fieldName",
      "location": "body"
    }
  ]
}
```

---

## Module 1 — Auth `/api/auth`

No authentication required for any endpoint in this module.

---

### POST `/api/auth/signup`

Creates a pending account and sends a 6-digit OTP to the provided email.

**Request**
```json
{
  "fullName": "John Doe",
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

| Field | Type | Rules |
|-------|------|-------|
| fullName | string | required |
| username | string | required, 3–30 chars, alphanumeric + `_` or `.` |
| email | string | required, valid email |
| phone | string | required, valid phone number |

**Response 201**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": {
    "email": "john@example.com"
  }
}
```

---

### POST `/api/auth/resend-otp`

Resends the OTP. Requires an active pending signup. 60 s cooldown between requests.

**Request**
```json
{
  "email": "john@example.com"
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Verification code resent",
  "data": {
    "email": "john@example.com"
  }
}
```

---

### POST `/api/auth/verify-otp`

Verifies the OTP and creates the user account. Returns auth tokens. Max 5 wrong attempts before requiring a new OTP.

**Request**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

| Field | Type | Rules |
|-------|------|-------|
| email | string | required, valid email |
| code | string | required, exactly 6 numeric digits |

**Response 200**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "username": "john_doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "isPrivate": false
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

## Module 2 — Users `/api/users`

All endpoints require authentication (`Authorization: Bearer <token>`).

---

### PATCH `/api/users/profile`

Updates the authenticated user's profile. Send as `multipart/form-data` when uploading a profile image.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| fullName | string | optional |
| username | string | optional, 3–30 chars |
| bio | string | optional, max 160 chars |
| profession | string | optional, max 100 chars |
| isPrivate | boolean | optional |
| profileImage | file | optional, image file |

**Response 200**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "fullName": "John Doe",
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "bio": "Software engineer",
    "profession": "Engineer",
    "isPrivate": false,
    "profileImage": "https://cdn.example.com/images/profile.jpg"
  }
}
```

---

### POST `/api/users/interests`

Saves the user's interests (used for feed personalization).

**Request**
```json
{
  "interests": ["technology", "music", "travel"]
}
```

| Field | Type | Rules |
|-------|------|-------|
| interests | string[] | required, min 5 items, each max 50 chars |

**Response 200**
```json
{
  "success": true,
  "message": "Interests saved successfully",
  "data": {
    "interests": ["technology", "music", "travel"]
  }
}
```

---

### GET `/api/users/interests`

Returns the authenticated user's saved interests.

**Response 200**
```json
{
  "success": true,
  "message": "Interests fetched successfully",
  "data": {
    "interests": ["technology", "music", "travel"]
  }
}
```

---

### GET `/api/users/follow-requests`

Returns all pending follow requests sent to the authenticated user.

**Response 200**
```json
{
  "success": true,
  "message": "Follow requests fetched",
  "data": {
    "requests": [
      {
        "id": "uuid",
        "username": "jane_doe",
        "fullName": "Jane Doe",
        "profileImage": "https://cdn.example.com/images/jane.jpg"
      }
    ]
  }
}
```

---

### PATCH `/api/users/follow-requests/:id/accept`

Accepts a follow request from user `id`.

**Response 200**
```json
{
  "success": true,
  "message": "Follow request accepted"
}
```

---

### PATCH `/api/users/follow-requests/:id/reject`

Rejects a follow request from user `id`.

**Response 200**
```json
{
  "success": true,
  "message": "Follow request rejected"
}
```

---

### GET `/api/users/followers`

Returns the authenticated user's followers list.

**Response 200**
```json
{
  "success": true,
  "message": "Followers fetched",
  "data": {
    "followers": [
      {
        "id": "uuid",
        "username": "jane_doe",
        "fullName": "Jane Doe",
        "profileImage": "https://cdn.example.com/images/jane.jpg"
      }
    ]
  }
}
```

---

### GET `/api/users/following`

Returns the list of accounts the authenticated user follows.

**Response 200**
```json
{
  "success": true,
  "message": "Following fetched",
  "data": {
    "following": [
      {
        "id": "uuid",
        "username": "jane_doe",
        "fullName": "Jane Doe",
        "profileImage": "https://cdn.example.com/images/jane.jpg"
      }
    ]
  }
}
```

---

### GET `/api/users/friends`

Returns mutual followers (friends).

**Response 200**
```json
{
  "success": true,
  "message": "Friends fetched",
  "data": {
    "friends": [
      {
        "id": "uuid",
        "username": "jane_doe",
        "fullName": "Jane Doe",
        "profileImage": "https://cdn.example.com/images/jane.jpg"
      }
    ]
  }
}
```

---

### GET `/api/users/suggestions`

Returns tiered follow suggestions based on social graph.

**Response 200**
```json
{
  "success": true,
  "message": "Friend suggestions fetched",
  "data": {
    "firstDegree": [
      {
        "id": "uuid",
        "username": "alice",
        "fullName": "Alice Smith",
        "profileImage": null
      }
    ],
    "secondDegree": [
      {
        "id": "uuid",
        "username": "bob",
        "fullName": "Bob Jones",
        "profileImage": null,
        "mutualFriendsCount": 3
      }
    ],
    "thirdDegree": [
      {
        "id": "uuid",
        "username": "charlie",
        "fullName": "Charlie Brown",
        "profileImage": null,
        "mutualConnectionsCount": 1
      }
    ]
  }
}
```

---

### GET `/api/users/saved/posts`

Returns all posts the authenticated user has saved.

**Response 200**
```json
{
  "success": true,
  "message": "Saved posts fetched",
  "data": {
    "posts": [
      {
        "id": "uuid",
        "caption": "Hello world #tech",
        "isPrivate": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "author": {
          "id": "uuid",
          "username": "jane_doe",
          "fullName": "Jane Doe",
          "profileImage": "https://cdn.example.com/images/jane.jpg"
        },
        "media": ["https://cdn.example.com/images/post1.jpg"],
        "hashtags": ["tech"],
        "mentions": [
          {
            "id": "uuid",
            "username": "alice",
            "profileImage": null
          }
        ],
        "likeCount": 42,
        "saveCount": 10,
        "hasLiked": false,
        "hasSaved": true
      }
    ]
  }
}
```

---

### GET `/api/users/saved/reels`

Returns all reels the authenticated user has saved.

**Response 200**
```json
{
  "success": true,
  "message": "Saved reels fetched",
  "data": {
    "reels": [
      {
        "id": "uuid",
        "videoUrl": "https://cdn.example.com/videos/reel1.mp4",
        "thumbnailUrl": "https://cdn.example.com/images/reel1-thumb.jpg",
        "caption": "Check this out!",
        "isPrivate": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "author": {
          "id": "uuid",
          "username": "jane_doe",
          "fullName": "Jane Doe",
          "profileImage": null
        },
        "hashtags": ["fun"],
        "mentions": [],
        "likeCount": 100,
        "saveCount": 25,
        "hasLiked": true,
        "hasSaved": true
      }
    ]
  }
}
```

---

### GET `/api/users/:id`

Returns a public profile. `followStatus` is `null` when viewing own profile.

**Response 200**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "username": "jane_doe",
    "fullName": "Jane Doe",
    "bio": "Designer & creator",
    "profession": "Designer",
    "profileImage": "https://cdn.example.com/images/jane.jpg",
    "isPrivate": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "postCount": 12,
    "reelCount": 4,
    "followerCount": 320,
    "followingCount": 180,
    "followStatus": "following",
    "isOwnProfile": false
  }
}
```

`followStatus` values: `"following"` | `"pending"` | `"none"` | `null`

---

### GET `/api/users/:id/posts`

Returns paginated posts for a user. Returns 403 if the account is private and you don't follow them.

**Query params**

| Param | Default |
|-------|---------|
| page | 1 |
| limit | 12 |

**Response 200**
```json
{
  "success": true,
  "message": "Posts fetched",
  "data": {
    "canView": true,
    "posts": [
      {
        "id": "uuid",
        "caption": "Sunset vibes #nature",
        "isPrivate": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "author": {
          "id": "uuid",
          "username": "jane_doe",
          "fullName": "Jane Doe",
          "profileImage": null
        },
        "media": ["https://cdn.example.com/images/post1.jpg"],
        "hashtags": ["nature"],
        "mentions": [],
        "likeCount": 55,
        "saveCount": 8,
        "hasLiked": false,
        "hasSaved": false
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 12
  }
}
```

---

### GET `/api/users/:id/reels`

Returns paginated reels for a user. Returns 403 if the account is private and you don't follow them.

**Query params**: same as `/posts` above.

**Response 200**
```json
{
  "success": true,
  "message": "Reels fetched",
  "data": {
    "canView": true,
    "reels": [
      {
        "id": "uuid",
        "videoUrl": "https://cdn.example.com/videos/reel1.mp4",
        "thumbnailUrl": "https://cdn.example.com/images/thumb.jpg",
        "caption": "Behind the scenes",
        "isPrivate": false,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "author": {
          "id": "uuid",
          "username": "jane_doe",
          "fullName": "Jane Doe",
          "profileImage": null
        },
        "hashtags": [],
        "mentions": [],
        "likeCount": 200,
        "saveCount": 30,
        "hasLiked": true,
        "hasSaved": false
      }
    ],
    "total": 4,
    "page": 1,
    "limit": 12
  }
}
```

---

### POST `/api/users/:id/follow`

Follows a user. Public accounts auto-accept; private accounts create a pending request.

**Response 200**
```json
{
  "success": true,
  "message": "Follow request sent"
}
```

---

### DELETE `/api/users/:id/follow`

Unfollows a user (or cancels a pending follow request).

**Response 200**
```json
{
  "success": true,
  "message": "Unfollowed successfully"
}
```

---

## Module 3 — Posts `/api/posts`

All endpoints require authentication.

---

### POST `/api/posts`

Creates a new post. Send as `multipart/form-data`. Hashtags and mentions are automatically extracted from the caption.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| images | file[] | required, one or more image files |
| caption | string | optional, max 2200 chars |
| isPrivate | boolean | optional |

**Response 201**
```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "uuid",
    "caption": "Golden hour #sunset @jane_doe",
    "isPrivate": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "author": {
      "id": "uuid",
      "username": "john_doe",
      "fullName": "John Doe",
      "profileImage": null
    },
    "media": ["https://cdn.example.com/images/post1.jpg"],
    "hashtags": ["sunset"],
    "mentions": [
      {
        "id": "uuid",
        "username": "jane_doe",
        "profileImage": null
      }
    ],
    "likeCount": 0,
    "saveCount": 0,
    "shareCount": 0,
    "hasLiked": false,
    "hasSaved": false
  }
}
```

---

### GET `/api/posts/:id`

Fetches a single post by ID.

**Response 200**
```json
{
  "success": true,
  "message": "Post fetched successfully",
  "data": {
    "id": "uuid",
    "caption": "Golden hour #sunset",
    "isPrivate": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "author": {
      "id": "uuid",
      "username": "john_doe",
      "fullName": "John Doe",
      "profileImage": null
    },
    "media": ["https://cdn.example.com/images/post1.jpg"],
    "hashtags": ["sunset"],
    "mentions": [],
    "likeCount": 42,
    "saveCount": 10,
    "shareCount": 5,
    "hasLiked": true,
    "hasSaved": false
  }
}
```

---

### POST `/api/posts/:id/like`

Toggles like on a post. Returns the new state after toggling.

**Response 200**
```json
{
  "success": true,
  "message": "Post liked",
  "data": {
    "liked": true,
    "likeCount": 43
  }
}
```

`message` is `"Post liked"` or `"Post unliked"` depending on the new state.

---

### POST `/api/posts/:id/save`

Toggles save on a post.

**Response 200**
```json
{
  "success": true,
  "message": "Post saved",
  "data": {
    "saved": true
  }
}
```

`message` is `"Post saved"` or `"Post unsaved"`.

---

### POST `/api/posts/:id/share`

Shares a post with the authenticated user's followers.

**Response 200**
```json
{
  "success": true,
  "message": "Post shared with your followers",
  "data": {
    "shareCount": 6
  }
}
```

---

## Module 4 — Reels `/api/reels`

All endpoints require authentication.

---

### POST `/api/reels`

Uploads a new reel. Send as `multipart/form-data`.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| video | file | required, single video file |
| caption | string | optional, max 2200 chars |
| isPrivate | boolean | optional |

**Response 201**
```json
{
  "success": true,
  "message": "Reel created successfully",
  "data": {
    "id": "uuid",
    "videoUrl": "https://cdn.example.com/videos/reel1.mp4",
    "thumbnailUrl": "https://cdn.example.com/images/thumb.jpg",
    "caption": "Day in my life #vlog",
    "isPrivate": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "author": {
      "id": "uuid",
      "username": "john_doe",
      "fullName": "John Doe",
      "profileImage": null
    },
    "hashtags": ["vlog"],
    "mentions": [],
    "likeCount": 0,
    "saveCount": 0,
    "shareCount": 0,
    "hasLiked": false,
    "hasSaved": false
  }
}
```

---

### GET `/api/reels/:id`

Fetches a single reel by ID.

**Response 200**
```json
{
  "success": true,
  "message": "Reel fetched successfully",
  "data": {
    "id": "uuid",
    "videoUrl": "https://cdn.example.com/videos/reel1.mp4",
    "thumbnailUrl": "https://cdn.example.com/images/thumb.jpg",
    "caption": "Day in my life #vlog",
    "isPrivate": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "author": {
      "id": "uuid",
      "username": "john_doe",
      "fullName": "John Doe",
      "profileImage": null
    },
    "hashtags": ["vlog"],
    "mentions": [],
    "likeCount": 100,
    "saveCount": 20,
    "shareCount": 8,
    "hasLiked": false,
    "hasSaved": false
  }
}
```

---

### POST `/api/reels/:id/like`

Toggles like on a reel.

**Response 200**
```json
{
  "success": true,
  "message": "Reel liked",
  "data": {
    "liked": true,
    "likeCount": 101
  }
}
```

---

### POST `/api/reels/:id/save`

Toggles save on a reel.

**Response 200**
```json
{
  "success": true,
  "message": "Reel saved",
  "data": {
    "saved": true
  }
}
```

---

### POST `/api/reels/:id/share`

Shares a reel with the authenticated user's followers.

**Response 200**
```json
{
  "success": true,
  "message": "Reel shared with your followers",
  "data": {
    "shareCount": 9
  }
}
```

---

## Module 5 — Chat `/api/chat`

All endpoints require authentication. Real-time messages are delivered via **Socket.IO** (`chat:message` event).

---

### POST `/api/chat/send`

Sends a message to another user. Send as `multipart/form-data` when attaching media.

- If recipient has a **private** account: messaging is only allowed when both users mutually follow each other.
- If recipient has a **public** account: messaging is always allowed.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| recipientId | string (uuid) | required |
| content | string | required if no media file |
| media | file | optional, single file |

**Response 201**
```json
{
  "success": true,
  "message": "Message sent",
  "data": {
    "conversationId": "uuid",
    "message": {
      "id": "uuid",
      "senderId": "uuid",
      "content": "Hey, how are you?",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "sender": {
        "id": "uuid",
        "username": "john_doe",
        "profileImage": null
      },
      "media": [
        {
          "mediaUrl": "https://cdn.example.com/chat/image.jpg",
          "mediaType": "image/jpeg"
        }
      ]
    }
  }
}
```

---

### GET `/api/chat/conversations`

Returns all conversations for the authenticated user, sorted by most recent message.

**Response 200**
```json
{
  "success": true,
  "message": "Conversations fetched",
  "data": [
    {
      "conversationId": "uuid",
      "otherUser": {
        "id": "uuid",
        "username": "jane_doe",
        "fullName": "Jane Doe",
        "profileImage": "https://cdn.example.com/images/jane.jpg"
      },
      "lastMessage": {
        "id": "uuid",
        "senderId": "uuid",
        "content": "See you tomorrow!",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      "lastReadAt": "2024-01-15T10:28:00.000Z"
    }
  ]
}
```

> Deleted messages have `content: null`.

---

### GET `/api/chat/conversations/:conversationId/messages`

Returns paginated messages in a conversation. Returns 403 if the user is not a participant.

**Query params**

| Param | Default | Description |
|-------|---------|-------------|
| limit | 30 | Number of messages to return |
| before | — | ISO timestamp for cursor-based pagination (returns messages before this time) |

**Response 200**
```json
{
  "success": true,
  "message": "Messages fetched",
  "data": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "content": "Hey!",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "sender": {
        "id": "uuid",
        "username": "john_doe",
        "profileImage": null
      },
      "media": [
        {
          "id": "uuid",
          "mediaUrl": "https://cdn.example.com/chat/image.jpg",
          "mediaType": "image/jpeg"
        }
      ]
    }
  ]
}
```

---

### DELETE `/api/chat/messages/:messageId`

Deletes a message. Only the sender can delete their own messages.

**Response 200**
```json
{
  "success": true,
  "message": "Message deleted"
}
```

---

### POST `/api/chat/upload`

Uploads media for use in chat without sending a message.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| media | file | required |

**Response 200**
```json
{
  "success": true,
  "message": "Media uploaded",
  "data": {
    "mediaUrl": "https://cdn.example.com/chat/image.jpg",
    "mediaType": "image/jpeg"
  }
}
```

---

## Module 6 — Feed `/api/feed`

All endpoints require authentication.

---

### GET `/api/feed`

Returns a personalized feed of posts and reels. Feed is scored and ranked based on:
- Content from followed accounts (2× bonus)
- Matches user interests (1.5× bonus)
- Recent saves (2×), shares (1.5×), and likes (1×)
- Time decay (lookback window: 14 days)
- Falls back to trending public content when needed

**Query params**

| Param | Default |
|-------|---------|
| page | 1 |
| limit | 20 |

**Response 200**
```json
{
  "success": true,
  "message": "Feed fetched",
  "data": {
    "feed": [
      {
        "type": "post",
        "id": "uuid",
        "caption": "Golden hour #sunset",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "author": {
          "id": "uuid",
          "username": "jane_doe",
          "fullName": "Jane Doe",
          "profileImage": null
        },
        "media": ["https://cdn.example.com/images/post1.jpg"],
        "hashtags": ["sunset"],
        "mentions": [],
        "likeCount": 55,
        "saveCount": 8,
        "shareCount": 3,
        "hasLiked": false,
        "hasSaved": false,
        "isFromFollowing": true
      },
      {
        "type": "reel",
        "id": "uuid",
        "caption": "Day in my life",
        "createdAt": "2024-01-14T18:00:00.000Z",
        "author": {
          "id": "uuid",
          "username": "bob",
          "fullName": "Bob Jones",
          "profileImage": null
        },
        "videoUrl": "https://cdn.example.com/videos/reel1.mp4",
        "thumbnailUrl": "https://cdn.example.com/images/thumb.jpg",
        "hashtags": [],
        "mentions": [],
        "likeCount": 200,
        "saveCount": 40,
        "shareCount": 15,
        "hasLiked": true,
        "hasSaved": false,
        "isFromFollowing": false
      }
    ],
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

> `type` is `"post"` or `"reel"`. Posts include `media[]`; reels include `videoUrl` and `thumbnailUrl`.

---

## Module 7 — Stories `/api/stories`

All endpoints require authentication. Stories expire **24 hours** after creation.

---

### POST `/api/stories`

Creates a new story. Send as `multipart/form-data`.

**Request** (`multipart/form-data`)

| Field | Type | Rules |
|-------|------|-------|
| file | file | required, image or video |
| caption | string | optional |

**Response 201**
```json
{
  "success": true,
  "message": "Story created",
  "data": {
    "id": "uuid",
    "mediaUrl": "https://cdn.example.com/stories/story1.jpg",
    "mediaType": "image",
    "caption": "Good morning!",
    "expiresAt": "2024-01-16T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

`mediaType` is `"image"` or `"video"`.

---

### GET `/api/stories/feed`

Returns active stories from accounts the authenticated user follows. Grouped by user; unseen stories appear first.

**Response 200**
```json
{
  "success": true,
  "message": "Story feed fetched",
  "data": [
    {
      "user": {
        "id": "uuid",
        "username": "jane_doe",
        "fullName": "Jane Doe",
        "profileImage": "https://cdn.example.com/images/jane.jpg"
      },
      "stories": [
        {
          "id": "uuid",
          "mediaUrl": "https://cdn.example.com/stories/story1.jpg",
          "mediaType": "image",
          "caption": "Coffee time",
          "expiresAt": "2024-01-16T08:00:00.000Z",
          "createdAt": "2024-01-15T08:00:00.000Z",
          "seen": false
        }
      ],
      "hasUnseen": true,
      "latestAt": "2024-01-15T08:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/stories/me`

Returns all active stories created by the authenticated user, including view counts.

**Response 200**
```json
{
  "success": true,
  "message": "Your stories fetched",
  "data": [
    {
      "id": "uuid",
      "mediaUrl": "https://cdn.example.com/stories/story1.jpg",
      "mediaType": "image",
      "caption": "Good morning!",
      "expiresAt": "2024-01-16T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "viewCount": 45
    }
  ]
}
```

---

### GET `/api/stories/:id`

Fetches a single story. Automatically records a view (unless viewer is the author). Returns 404 for expired stories.

**Response 200**
```json
{
  "success": true,
  "message": "Story fetched",
  "data": {
    "id": "uuid",
    "mediaUrl": "https://cdn.example.com/stories/story1.jpg",
    "mediaType": "image",
    "caption": "Good morning!",
    "expiresAt": "2024-01-16T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "author": {
      "id": "uuid",
      "username": "jane_doe",
      "profileImage": "https://cdn.example.com/images/jane.jpg"
    },
    "viewCount": 46
  }
}
```

---

### GET `/api/stories/:id/viewers`

Returns a list of users who viewed the story. Only the story owner can access this. Returns 403 otherwise.

**Response 200**
```json
{
  "success": true,
  "message": "Story viewers fetched",
  "data": [
    {
      "id": "uuid",
      "username": "alice",
      "fullName": "Alice Smith",
      "profileImage": null,
      "viewedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### DELETE `/api/stories/:id`

Deletes a story. Only the story owner can delete it.

**Response 200**
```json
{
  "success": true,
  "message": "Story deleted"
}
```

---

## Real-time — Socket.IO

| Event | Direction | Payload |
|-------|-----------|---------|
| `chat:message` | Server → Client | Full message object (same shape as `POST /api/chat/send` response `data.message`) |

Connect with the access token:
```js
const socket = io("https://<your-domain>", {
  auth: { token: accessToken }
});
```

---

## Notes for Integration

| Topic | Detail |
|-------|--------|
| File uploads | Use `multipart/form-data` for any endpoint marked as such; JSON will be rejected |
| Timestamps | All timestamps are ISO 8601 UTC (`2024-01-15T10:30:00.000Z`) |
| UUIDs | All `id` fields are UUID v4 strings |
| Pagination | Use `page` + `limit` query params; check `hasMore` (feed) or compare `total` vs current offset |
| CDN URLs | `profileImage`, `media`, `videoUrl`, `thumbnailUrl`, `mediaUrl` fields are all absolute CDN URLs; use directly in `<img>`/`<video>` |
| Private accounts | Respect `isPrivate` + `followStatus` — private account content is gated behind a follow relationship |
| Toggle endpoints | Like and Save are toggles — call the same endpoint to undo |
| Search & Notifications | Not yet implemented |
