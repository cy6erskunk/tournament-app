# API Reference

Complete reference for all REST API endpoints in the Tournament App.

## Authentication

Most endpoints require authentication via JWT token stored in an HTTP-only cookie named `token`.

| Status Code | Meaning |
|-------------|---------|
| `401`       | No valid session (missing or expired token) |
| `403`       | Insufficient permissions (not admin role) |

---

## Player Endpoints

### POST `/api/newplayer`

Create a new player and add them to a tournament.

**Auth**: Admin required

**Request Body**:
```json
{
  "name": "PlayerName",
  "tournamentId": 5
}
```

**Response** `200`:
```json
{
  "name": "PlayerName",
  "matches": []
}
```

**Errors**: `400` invalid body, `401` no session, `403` not admin, `500` missing name/tournament

---

### POST `/api/addplayer`

Add an existing player to a tournament (with optional pool assignment for round-robin).

**Auth**: Admin required

**Request Body**:
```json
{
  "name": "PlayerName",
  "tournamentId": 5,
  "poolId": 2
}
```

`poolId` is optional. Set it for round-robin tournaments to assign the player to a pool.

**Response** `200`: Player object

**Errors**: `400` invalid body, `401` no session, `403` not admin

---

### POST `/api/removeplayer`

Remove a player from a tournament.

**Auth**: Admin required

**Request Body**:
```json
{
  "name": "PlayerName",
  "tournamentId": 5
}
```

**Response** `200`: Confirmation

**Errors**: `403` unauthorized, `500` missing fields

---

### GET `/api/tournament/[tournamentId]/players`

Fetch all players for a tournament, including their match history.

**Auth**: Admin required

**URL Params**: `tournamentId` (number)

**Response** `200`:
```json
[
  {
    "name": "Player1",
    "matches": [
      {
        "id": 1,
        "round": 1,
        "match": 1,
        "player1": "Player1",
        "player2": "Player2",
        "player1_hits": 5,
        "player2_hits": 3,
        "winner": "Player1"
      }
    ]
  }
]
```

**Errors**: `400` invalid tournament ID, `403` unauthorized

---

### GET `/api/admin/players`

List all players in the system (global player registry).

**Auth**: Admin required

**Response** `200`:
```json
[
  { "player_name": "Player1" },
  { "player_name": "Player2" }
]
```

---

### POST `/api/admin/players`

Create a standalone player (not added to any tournament).

**Auth**: Admin required

**Request Body**:
```json
{
  "playerName": "NewPlayer"
}
```

**Validation**: Non-empty, max 16 characters

**Response** `201`: Player object

**Errors**: `400` validation error, `401` unauthorized

---

### PATCH `/api/admin/players/[name]`

Rename a player.

**Auth**: Admin required

**URL Params**: `name` (current player name)

**Request Body**:
```json
{
  "newName": "UpdatedName"
}
```

**Response** `200`: Updated player object

---

## Tournament Endpoints

### POST `/api/tournament/name`

Create or update a tournament.

**Auth**: Admin required

**Request Body**:
```json
{
  "id": 5,
  "name": "Spring Championship 2025",
  "require_submitter_identity": false,
  "public_results": true
}
```

**Response** `200`: Success message

**Errors**: `400` parsing error, `403` unauthorized

---

### DELETE `/api/tournament/name`

Delete a tournament.

**Auth**: Admin required

**Request Body**:
```json
{
  "id": 5,
  "name": "Spring Championship 2025"
}
```

**Response** `200`: Confirmation message

---

### GET `/api/tournament/[tournamentId]/seed/[currentId]`

Generate bracket seeding from a completed tournament's results.

**Auth**: Admin required

**URL Params**:
- `tournamentId`: Source tournament (results to seed from)
- `currentId`: Target bracket tournament

**Logic**:
1. Fetches all players and matches from the source tournament
2. Sorts players by win percentage (descending)
3. Calculates bracket positions with proper bye handling
4. Creates `tournament_players` entries with `bracket_match` and `bracket_seed`

**Response** `200`: Array of seeded player pairs

---

## Match Endpoints

### POST `/api/matches`

Create a new match.

**Auth**: Admin required

**Request Body**:
```json
{
  "player1": "Alice",
  "player2": "Bob",
  "player1_hits": 5,
  "player2_hits": 3,
  "winner": "Alice",
  "tournament_id": 5,
  "round": 1,
  "match": 1,
  "submitted_by_token": null,
  "submitted_at": null
}
```

**Validation**: `winner` must not be null.

**Response** `200`: Created match row

**Errors**: `400` invalid body or null winner, `403` unauthorized, `409` duplicate match (unique constraint)

---

### PUT `/api/matches`

Update an existing match.

**Auth**: Admin required

**Request Body**: Same as POST

**Response** `200`: Updated match row

---

### DELETE `/api/matches`

Delete a match.

**Auth**: Admin required

**Request Body**: Match object (minimal, with identifying fields)

**Response** `200`: Deleted match data

---

## Pool Endpoints

### GET `/api/tournament/[tournamentId]/pools`

Get all pools for a tournament.

**Auth**: Optional

**Response** `200`:
```json
[
  { "id": 1, "tournament_id": 5, "name": "Pool 1" },
  { "id": 2, "tournament_id": 5, "name": "Pool 2" }
]
```

---

### POST `/api/tournament/[tournamentId]/pools`

Create a new pool.

**Auth**: Admin required

**Request Body**:
```json
{
  "name": "Pool 3"
}
```

`name` is optional — auto-generated as "Pool N" if omitted.

**Response** `200`: Created pool object

---

### DELETE `/api/tournament/[tournamentId]/pools`

Delete a pool.

**Auth**: Admin required

**Request Body**:
```json
{
  "poolId": 2
}
```

**Response** `200`: "OK"

**Errors**: `404` pool not found

---

### POST `/api/tournament/[tournamentId]/pools/[poolId]/players`

Assign a player to a pool. Use `poolId=0` to unassign.

**Auth**: Admin required

**Request Body**:
```json
{
  "playerName": "Alice"
}
```

**Response** `200`: "OK"

**Errors**: `404` pool not found (unless poolId=0)

---

## QR Match Endpoints

### POST `/api/qr-match/generate`

Generate QR code data for external match submission.

**Auth**: Admin required

**Request Body**:
```json
{
  "player1": "Alice",
  "player2": "Bob",
  "tournamentId": 5,
  "round": 1,
  "match": 1
}
```

**Response** `200`:
```json
{
  "matchId": "abc123def456",
  "player1": "Alice",
  "player2": "Bob",
  "tournamentId": 5,
  "round": 1,
  "baseUri": "https://myapp.vercel.app",
  "submitUrl": "https://myapp.vercel.app/api/qr-match/submit",
  "requireSubmitterIdentity": false
}
```

The generated `matchId` is stored in memory and expires after 1 hour.

---

### POST `/api/qr-match/submit`

Submit match results from an external QR code scanner.

**Auth**: Device token required only if tournament has `require_submitter_identity` enabled.

**CORS**: Enabled (see OPTIONS endpoint)

**Request Body**:
```json
{
  "matchId": "abc123def456",
  "deviceToken": "device-token-here",
  "player1_hits": 5,
  "player2_hits": 3,
  "winner": "Alice"
}
```

**Validation** (Zod schema):
- `player1_hits`: Non-negative integer
- `player2_hits`: Non-negative integer
- `winner`: Must match either player1 or player2 name from stored match data

**Response** `200`:
```json
{
  "success": true,
  "match": {
    "id": 42,
    "tournament_id": 5,
    "round": 1,
    "match": 1,
    "player1": "Alice",
    "player2": "Bob",
    "player1_hits": 5,
    "player2_hits": 3,
    "winner": "Alice"
  }
}
```

**Errors**: `400` validation error, `401` invalid/missing device token, `404` matchId not found/expired, `500` database error

---

### OPTIONS `/api/qr-match/submit`

CORS preflight handler.

**Response** `200` with headers:
```
Access-Control-Allow-Origin: * (dev) or CORS_ALLOWED_ORIGIN (prod)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Device Registration Endpoints

### POST `/api/submitter/register`

Register a new external device for QR match submissions.

**Auth**: None (public endpoint)

**CORS**: Enabled

**Request Body**:
```json
{
  "name": "Referee Tablet 1"
}
```

**Response** `201`:
```json
{
  "deviceToken": "generated-unique-token",
  "name": "Referee Tablet 1",
  "message": "Device registered successfully"
}
```

---

### OPTIONS `/api/submitter/register`

CORS preflight handler. Same headers as QR match submit.

---

## Admin User Endpoints

### GET `/api/admin/users`

List all users.

**Auth**: Admin required

**Response** `200`:
```json
[
  { "username": "admin1", "role": "admin" },
  { "username": "referee1", "role": "user" }
]
```

Passwords are excluded from the response.

---

### POST `/api/admin/users`

Create a new user.

**Auth**: Admin required

**Request Body**:
```json
{
  "username": "newuser",
  "password": "securepassword",
  "role": "user"
}
```

`role` must be `"user"` or `"admin"`.

**Response** `201`: Created user object

---

### GET `/api/admin/users/[username]`

Get a specific user.

**Auth**: Admin required

**Response** `200`: User object (without password)

**Errors**: `404` user not found

---

### PATCH `/api/admin/users/[username]`

Update a user's role or password (one at a time).

**Auth**: Admin required

**Request Body** (one of):
```json
{ "role": "admin" }
```
or
```json
{ "password": "newpassword" }
```

Cannot update both in the same request.

**Response** `200`: Updated user data or success message

---

### DELETE `/api/admin/users/[username]`

Delete a user.

**Auth**: Admin required

**Protection**: Cannot delete the last admin user.

**Response** `200`: Success message

**Errors**: `400` attempting to delete last admin

---

## Admin Device Endpoints

### GET `/api/admin/devices`

List all registered devices.

**Auth**: Admin required

**Response** `200`:
```json
[
  {
    "device_token": "abc-123",
    "submitter_name": "Referee Tablet 1",
    "created_at": "2025-01-15T10:30:00Z",
    "last_used": "2025-01-20T14:22:00Z"
  }
]
```

---

### DELETE `/api/admin/devices/[deviceToken]`

Revoke a device token.

**Auth**: Admin required

**Response** `200`: Success message

---

## Admin QR Audit Endpoint

### GET `/api/admin/qr-audit`

Retrieve QR code submission audit logs.

**Auth**: Admin required

**Response** `200`: Array of audit log entries

**Note**: Currently a placeholder for future implementation.

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Description of what went wrong"
}
```

### Standard HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Successful GET, PUT, DELETE |
| `201` | Successful POST (resource created) |
| `400` | Invalid input, validation failure, bad JSON |
| `401` | Missing or invalid authentication |
| `403` | Insufficient permissions (not admin) |
| `404` | Resource not found |
| `409` | Conflict (duplicate unique constraint) |
| `500` | Server/database error |
