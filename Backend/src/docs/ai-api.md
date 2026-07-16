# Mentra AI API — Phase 1 Documentation

Base URL: `http://localhost:3000/api/ai`

All endpoints require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

Rate limit: **30 requests/minute** per IP.

---

## Table of Contents

1. [Health Check](#1-health-check)
2. [Create Conversation](#2-create-conversation)
3. [List Conversations](#3-list-conversations)
4. [Get Conversation](#4-get-conversation)
5. [Get Messages](#5-get-messages)
6. [Rename Conversation](#6-rename-conversation)
7. [Delete Conversation](#7-delete-conversation)
8. [Send Message (Chat)](#8-send-message-chat)

---

## 1. Health Check

Verify provider connectivity and see registered tools.

```
GET /api/ai/health
```

### Response — 200 OK (provider healthy)

```json
{
  "success": true,
  "provider": "openrouter",
  "model": "meta-llama/llama-3.1-8b-instruct:free",
  "registeredTools": ["explain", "summarize"],
  "latencyMs": 312
}
```

### Response — 503 (provider unreachable)

```json
{
  "success": false,
  "provider": "openrouter",
  "model": "meta-llama/llama-3.1-8b-instruct:free",
  "registeredTools": ["explain", "summarize"],
  "latencyMs": 5001,
  "error": "connect ECONNREFUSED"
}
```

---

## 2. Create Conversation

Creates a new conversation. Call this before the first `sendMessage`.

```
POST /api/ai/conversations
```

### Request Body

```json
{
  "title": "My Study Session",
  "context": {
    "workspaceId": "665f1a2b3c4d5e6f7a8b9c0d",
    "subjectId": "665f1a2b3c4d5e6f7a8b9c0e",
    "folderId": null,
    "resourceId": null
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Max 150 chars. Defaults to `"New Conversation"` |
| `context` | object | No | Optional workspace/subject context |
| `context.workspaceId` | MongoId | No | Link to a workspace |
| `context.subjectId` | MongoId | No | Link to a subject |
| `context.folderId` | MongoId | No | Link to a folder (Phase 2) |
| `context.resourceId` | MongoId | No | Link to a note/file (Phase 2) |

### Response — 201 Created

```json
{
  "success": true,
  "message": "Conversation created",
  "resource": {
    "id": "665f1a2b3c4d5e6f7a8b9c0f",
    "title": "My Study Session",
    "model": null,
    "context": {
      "workspaceId": "665f1a2b3c4d5e6f7a8b9c0d",
      "subjectId": "665f1a2b3c4d5e6f7a8b9c0e",
      "folderId": null,
      "resourceId": null
    },
    "messageCount": 0,
    "lastMessageAt": null,
    "createdAt": "2026-07-15T09:00:00.000Z",
    "updatedAt": "2026-07-15T09:00:00.000Z"
  }
}
```

### Errors

| Code | Message |
|------|---------|
| 401 | Authentication token is required |
| 422 | Validation errors |

---

## 3. List Conversations

Returns all active conversations for the authenticated user, sorted by most recently active.

```
GET /api/ai/conversations?page=1&limit=20
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (>= 1) |
| `limit` | integer | 20 | Items per page (1-50) |

### Response — 200 OK

```json
{
  "success": true,
  "resources": [
    {
      "id": "665f1a2b3c4d5e6f7a8b9c0f",
      "title": "My Study Session",
      "model": "meta-llama/llama-3.1-8b-instruct:free",
      "context": {
        "workspaceId": "665f1a2b3c4d5e6f7a8b9c0d",
        "subjectId": null,
        "folderId": null,
        "resourceId": null
      },
      "messageCount": 6,
      "lastMessageAt": "2026-07-15T09:30:00.000Z",
      "createdAt": "2026-07-15T09:00:00.000Z",
      "updatedAt": "2026-07-15T09:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pages": 3
  }
}
```

---

## 4. Get Conversation

Returns conversation metadata. **Does not include messages.** Use Get Messages for the message list.

```
GET /api/ai/conversations/:id
```

### Response — 200 OK

```json
{
  "success": true,
  "resource": {
    "id": "665f1a2b3c4d5e6f7a8b9c0f",
    "title": "My Study Session",
    "model": "meta-llama/llama-3.1-8b-instruct:free",
    "context": { "workspaceId": null, "subjectId": null, "folderId": null, "resourceId": null },
    "messageCount": 4,
    "lastMessageAt": "2026-07-15T09:30:00.000Z",
    "createdAt": "2026-07-15T09:00:00.000Z",
    "updatedAt": "2026-07-15T09:30:00.000Z"
  }
}
```

### Errors

| Code | Message |
|------|---------|
| 404 | Conversation not found |
| 422 | Conversation ID is invalid |

---

## 5. Get Messages

Paginated message history. Returns in chronological order.

```
GET /api/ai/conversations/:id/messages?limit=50&before=2026-07-15T10:00:00Z
```

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `limit` | integer | 1-100, default 50 |
| `before` | ISO 8601 date | Cursor for pagination (load messages before this timestamp) |

### Response — 200 OK

```json
{
  "success": true,
  "resources": [
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c10",
      "role": "user",
      "content": "What is database normalization?",
      "toolUsed": null,
      "modelUsed": null,
      "latencyMs": null,
      "createdAt": "2026-07-15T09:05:00.000Z"
    },
    {
      "_id": "665f1a2b3c4d5e6f7a8b9c11",
      "role": "assistant",
      "content": "**What it is**\nDatabase normalization is the process of...",
      "toolUsed": "explain",
      "modelUsed": "meta-llama/llama-3.1-8b-instruct:free",
      "latencyMs": 1842,
      "createdAt": "2026-07-15T09:05:02.000Z"
    }
  ]
}
```

---

## 6. Rename Conversation

Updates the title of a conversation.

```
PATCH /api/ai/conversations/:id
```

### Request Body

```json
{
  "title": "DBMS Study Notes"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | 1-150 characters |

### Response — 200 OK

```json
{
  "success": true,
  "message": "Conversation renamed",
  "resource": { "id": "...", "title": "DBMS Study Notes" }
}
```

---

## 7. Delete Conversation

Permanently deletes a conversation and **all its messages**.

```
DELETE /api/ai/conversations/:id
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Conversation deleted"
}
```

### Errors

| Code | Message |
|------|---------|
| 404 | Conversation not found |

---

## 8. Send Message (Chat)

Sends a message to the AI. The server automatically detects intent via the Planner and routes to the correct tool.

```
POST /api/ai/chat
POST /api/ai/chat?stream=true   <- Server-Sent Events
```

### Request Body

```json
{
  "conversationId": "665f1a2b3c4d5e6f7a8b9c0f",
  "message": "Explain database normalization to me"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | MongoId | Yes | Must be an existing, owned conversation |
| `message` | string | Yes | 1-10,000 characters. Natural language only. |

> **Note:** There is NO `tool` field. The Planner detects intent automatically.

---

### Non-Streaming Response — 200 OK

```json
{
  "success": true,
  "resource": {
    "content": "**What it is**\nDatabase normalization is the process of structuring...",
    "toolUsed": "explain",
    "intent": "explain",
    "latencyMs": 1842,
    "conversationId": "665f1a2b3c4d5e6f7a8b9c0f"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `content` | string | The AI's full response |
| `toolUsed` | string or null | `"explain"`, `"summarize"`, or `null` (general chat) |
| `intent` | string | Planner's detected intent |
| `latencyMs` | number | End-to-end response time in ms |
| `conversationId` | string | The conversation ID |

---

### Streaming Response — SSE (`?stream=true`)

When `?stream=true` is appended, the response is `text/event-stream`.

**Event format:**

```
data: {"type":"chunk","data":"Database"}

data: {"type":"chunk","data":" normalization"}

data: {"type":"chunk","data":" is..."}

data: {"type":"done","toolUsed":"explain","intent":"explain","latencyMs":1842}

data: [DONE]
```

**Event types:**

| type | payload | Description |
|------|---------|-------------|
| `chunk` | `{ data: string }` | A token chunk from the model |
| `done` | `{ toolUsed, intent, latencyMs }` | Stream complete |
| `error` | `{ message: string }` | Error occurred |

**Client-side example (fetch API):**

```js
const response = await fetch('/api/ai/chat?stream=true', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ conversationId, message }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  const lines = decoder.decode(value).split('\n');
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const raw = line.slice(6);
    if (raw === '[DONE]') break;

    const event = JSON.parse(raw);
    if (event.type === 'chunk') appendToUI(event.data);
    if (event.type === 'done') saveMeta(event);
    if (event.type === 'error') showError(event.message);
  }
}
```

---

## Intent Detection Examples

The Planner classifies messages automatically — no tool field needed from the frontend.

| User message | Detected intent | Tool used |
|---|---|---|
| "What is DBMS?" | `explain` | `explain` |
| "Explain React hooks simply" | `explain` | `explain` |
| "How does JWT authentication work?" | `explain` | `explain` |
| "Summarize this: long text" | `summarize` | `summarize` |
| "TL;DR this article: text" | `summarize` | `summarize` |
| "Hello, how are you?" | `general_chat` | none (direct LLM) |
| "What did we just talk about?" | `general_chat` | none (direct LLM) |
| "Help me understand my notes" | `general_chat` | none (direct LLM) |

---

## Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

### Common Error Codes

| Status | Meaning |
|--------|---------|
| 401 | Not authenticated or token expired |
| 404 | Resource not found |
| 422 | Validation failed |
| 429 | AI rate limit exceeded (30 req/min) |
| 502 | AI provider error (bad API key, downstream failure) |
| 503 | AI provider temporarily unavailable |
| 504 | AI provider timed out |

---

## MongoDB Collections Created

| Collection | Purpose |
|------------|---------|
| `conversations` | Conversation metadata + context |
| `messages` | Individual message turns |
| `ailogs` | LLM request logs (90-day TTL auto-delete) |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes | — | API key from openrouter.ai/keys |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | Override for proxies |
| `OPENROUTER_MODEL` | No | `meta-llama/llama-3.1-8b-instruct:free` | Model to use |
| `AI_MAX_CONTEXT_MESSAGES` | No | `20` | Conversation history window size |
| `AI_REQUEST_TIMEOUT_MS` | No | `30000` | LLM request timeout (ms) |
| `AI_LOG_LEVEL` | No | `db` | `"db"` or `"console"` or `"none"` |
