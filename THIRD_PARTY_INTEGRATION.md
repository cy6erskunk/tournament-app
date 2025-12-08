# Third-Party App Integration Guide

This document provides comprehensive instructions for integrating third-party applications with the Tournament App's QR code match submission system.

## Overview

The Tournament App supports external match result submission via QR codes. Tournament organizers can generate QR codes that encode match information, which third-party apps can scan to submit match results directly to the tournament system.

### Use Cases

- Mobile scoring apps for athletes
- Electronic scoreboards
- Automated scoring systems
- Custom tournament management tools

### Key Features

- **QR Code-Based Matching**: Match data is encoded in QR codes for easy scanning
- **Audit Trail Support**: Optional device registration for accountability
- **CORS-Enabled**: Cross-origin requests supported for web-based apps
- **RESTful API**: Simple JSON-based HTTP API

---

## Integration Flow

### 1. Basic Flow (No Audit Trail)

```
1. Tournament admin generates QR code in Tournament App
2. QR code contains match metadata (players, tournament ID, round, etc.)
3. Third-party app scans QR code
4. App parses JSON data from QR code
5. User enters match results in the app
6. App submits results to submitUrl endpoint
7. Tournament App processes and stores results
```

### 2. Flow with Audit Trail (Tournament Requires Identity)

```
1. User registers device with their name (one-time setup)
   → POST /api/submitter/register
   → Receives deviceToken (store securely on device)

2. Tournament admin generates QR code
3. Third-party app scans QR code
4. App checks requireSubmitterIdentity field
5. If true, app includes stored deviceToken in submission
6. App submits results with deviceToken
7. Tournament App validates token and records submitter identity
```

---

## QR Code Data Structure

### QRMatchData Interface

QR codes encode a JSON object with the following structure:

```typescript
{
  "matchId": "abc123xyz789",           // Unique match identifier (32 chars)
  "player1": "John Smith",             // First player name
  "player2": "Jane Doe",               // Second player name
  "tournamentId": 42,                  // Tournament database ID
  "round": 1,                          // Round number
  "submitUrl": "https://example.com/api/qr-match/submit",  // Submission endpoint
  "requireSubmitterIdentity": false    // Whether device token is required
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `matchId` | string | Unique identifier for this match (cryptographically random, 32 characters) |
| `player1` | string | Name of the first player/competitor |
| `player2` | string | Name of the second player/competitor |
| `tournamentId` | number | Internal tournament ID in the system |
| `round` | number | Round number in the tournament |
| `submitUrl` | string | Full URL endpoint for submitting results (use this!) |
| `requireSubmitterIdentity` | boolean | If `true`, deviceToken must be included in submission |

---

## API Endpoints

### Base URL

The base URL is environment-specific and provided in the `submitUrl` field of the QR code data.

- **Production**: `https://your-domain.com`
- **Development**: `http://localhost:3000`

### 1. Device Registration (Optional)

**Endpoint**: `POST /api/submitter/register`

**Purpose**: Register a device/user for audit trail tracking

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "John Doe"
}
```

**Success Response** (HTTP 201):
```json
{
  "deviceToken": "abc123xyz789...",
  "name": "John Doe",
  "message": "Device registered successfully"
}
```

**Validation Rules**:
- `name` is required and cannot be empty
- `name` must be 255 characters or less
- Leading/trailing whitespace is automatically trimmed

**Error Responses**:
- `400 Bad Request`: Invalid request data or missing name
- `500 Internal Server Error`: Database error

**Important Notes**:
- Device tokens are **persistent** and should be stored securely on the device
- Registration is only required once per device
- The same device token can be used across multiple tournaments
- Tokens never expire unless manually deleted from the database

---

### 2. Submit Match Results

**Endpoint**: `POST /api/qr-match/submit`

**Purpose**: Submit match results for a QR-generated match

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "matchId": "abc123xyz789",
  "deviceToken": "optional_token_here",
  "player1_hits": 5,
  "player2_hits": 3,
  "winner": "John Smith"
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `matchId` | string | Yes | Match ID from QR code |
| `deviceToken` | string | Conditional | Required if `requireSubmitterIdentity` is `true` in QR data |
| `player1_hits` | number | Yes | Number of hits/points scored by player 1 |
| `player2_hits` | number | Yes | Number of hits/points scored by player 2 |
| `winner` | string | Yes | Name of the winning player (must match player1 or player2 exactly) |

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "match": {
    "id": 123,
    "player1": "John Smith",
    "player2": "Jane Doe",
    "player1_hits": 5,
    "player2_hits": 3,
    "winner": "John Smith",
    "round": 1,
    "tournament_id": 42,
    "match": 1
  }
}
```

**Error Responses**:

| Status Code | Message | Cause |
|-------------|---------|-------|
| `400` | "Error reading match result" | Invalid JSON in request body |
| `400` | "Error adding/updating match: ..." | Failed to save match (validation error) |
| `401` | "Device registration required for this tournament" | Tournament requires deviceToken but none provided |
| `401` | "Invalid device token" | Provided deviceToken doesn't exist in system |
| `404` | "Invalid or expired match ID" | matchId not found or already used |
| `404` | "Tournament not found" | Tournament was deleted |

**Important Notes**:
- Match IDs are **single-use**: Once a match is submitted, the matchId is removed from the system
- If a match already exists in the database, it will be **updated** with the new results
- If no match exists, a new match record will be **created**
- The `winner` field must exactly match either `player1` or `player2` from the QR code data (case-sensitive)
- Audit trail (submitted_by_token, submitted_at) is automatically recorded if deviceToken is valid

---

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) to allow web-based third-party apps to make requests.

### Preflight Requests

Both endpoints support OPTIONS requests for CORS preflight:

```http
OPTIONS /api/qr-match/submit HTTP/1.1
OPTIONS /api/submitter/register HTTP/1.1
```

**Response Headers**:
```
Access-Control-Allow-Origin: * (development) or configured domain (production)
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

### Environment-Specific Configuration

- **Development**: Allows all origins (`*`) for testing
- **Production**: Restricted to single domain configured in `CORS_ALLOWED_ORIGIN` environment variable

**Note**: For production deployments, contact the tournament organizer to whitelist your app's domain.

---

## Implementation Examples

### Example 1: Basic JavaScript Integration (No Audit Trail)

```javascript
async function submitMatchResult(qrData, player1Hits, player2Hits, winner) {
  try {
    const response = await fetch(qrData.submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId: qrData.matchId,
        player1_hits: player1Hits,
        player2_hits: player2Hits,
        winner: winner,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Submission failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Match submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error submitting match:', error);
    throw error;
  }
}

// Usage
const qrCodeData = JSON.parse(scannedQRCodeString);
await submitMatchResult(qrCodeData, 5, 3, 'John Smith');
```

---

### Example 2: React Native with Audit Trail

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_TOKEN_KEY = 'tournament_device_token';

// One-time device registration
async function registerDevice(name, baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/api/submitter/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();

    // Store token securely on device
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, data.deviceToken);

    return data.deviceToken;
  } catch (error) {
    console.error('Device registration error:', error);
    throw error;
  }
}

// Submit match with device token
async function submitMatchWithIdentity(qrData, player1Hits, player2Hits, winner) {
  try {
    // Check if device token is required
    let deviceToken = null;
    if (qrData.requireSubmitterIdentity) {
      deviceToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);

      if (!deviceToken) {
        throw new Error('Device not registered. Please register first.');
      }
    }

    const response = await fetch(qrData.submitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matchId: qrData.matchId,
        deviceToken: deviceToken,
        player1_hits: player1Hits,
        player2_hits: player2Hits,
        winner: winner,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Submission failed: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting match:', error);
    throw error;
  }
}

// Complete workflow
async function handleQRScan(qrCodeString, player1Hits, player2Hits, winner) {
  try {
    const qrData = JSON.parse(qrCodeString);

    // Check if device registration is required
    if (qrData.requireSubmitterIdentity) {
      const existingToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);

      if (!existingToken) {
        // Prompt user for their name
        const userName = await promptForUserName();
        await registerDevice(userName, extractBaseUrl(qrData.submitUrl));
      }
    }

    // Submit match
    const result = await submitMatchWithIdentity(qrData, player1Hits, player2Hits, winner);
    console.log('Match submitted:', result);
  } catch (error) {
    console.error('Error:', error);
    alert(`Failed to submit match: ${error.message}`);
  }
}

// Helper to extract base URL from submit URL
function extractBaseUrl(submitUrl) {
  const url = new URL(submitUrl);
  return url.origin;
}
```

---

### Example 3: Python Integration

```python
import json
import requests
from typing import Dict, Any

class TournamentAPIClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.device_token = None

    def register_device(self, name: str) -> str:
        """Register device and return token"""
        response = requests.post(
            f"{self.base_url}/api/submitter/register",
            json={"name": name},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()

        data = response.json()
        self.device_token = data["deviceToken"]
        return self.device_token

    def submit_match(
        self,
        qr_data: Dict[str, Any],
        player1_hits: int,
        player2_hits: int,
        winner: str
    ) -> Dict[str, Any]:
        """Submit match results"""
        payload = {
            "matchId": qr_data["matchId"],
            "player1_hits": player1_hits,
            "player2_hits": player2_hits,
            "winner": winner
        }

        # Include device token if required or available
        if qr_data.get("requireSubmitterIdentity") and self.device_token:
            payload["deviceToken"] = self.device_token
        elif self.device_token:
            payload["deviceToken"] = self.device_token

        response = requests.post(
            qr_data["submitUrl"],
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()

        return response.json()

# Usage
qr_code_json = '{"matchId":"abc123",...}'  # Scanned from QR code
qr_data = json.loads(qr_code_json)

client = TournamentAPIClient(
    base_url=qr_data["submitUrl"].rsplit("/api", 1)[0]
)

# Register device if needed (one-time)
if qr_data.get("requireSubmitterIdentity"):
    client.register_device("John Doe")

# Submit match
result = client.submit_match(
    qr_data=qr_data,
    player1_hits=5,
    player2_hits=3,
    winner=qr_data["player1"]
)
print(f"Match submitted: {result}")
```

---

## Security Considerations

### 1. Device Token Storage

- Store device tokens **securely** on the device (e.g., Keychain on iOS, KeyStore on Android)
- Never log or display tokens to users
- Tokens are cryptographically random 32-character strings

### 2. Match ID Security

- Match IDs are single-use and expire after submission
- Each match ID is a cryptographically secure random string
- Invalid/expired match IDs return `404` errors

### 3. HTTPS Requirements

- **Always use HTTPS** in production
- The `submitUrl` field will use HTTPS in production environments
- Development environments may use HTTP (localhost only)

### 4. Input Validation

- Validate that `winner` matches one of the player names
- Ensure hit counts are non-negative integers
- Check that all required fields are present

### 5. CORS Restrictions

- Production APIs restrict origins to configured domains
- Contact tournament administrators to whitelist your app domain
- Development environments allow all origins for testing

---

## Error Handling Best Practices

### 1. Network Errors

```javascript
async function submitWithRetry(qrData, results, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await submitMatchResult(qrData, results);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

### 2. User-Friendly Error Messages

```javascript
function getErrorMessage(response, defaultMessage) {
  const errorMap = {
    400: 'Invalid match data. Please check your input.',
    401: 'Device registration required. Please register your device first.',
    404: 'Match not found or already submitted.',
    500: 'Server error. Please try again later.',
  };

  return errorMap[response.status] || defaultMessage;
}
```

### 3. Validation Before Submission

```javascript
function validateMatchResult(qrData, player1Hits, player2Hits, winner) {
  const errors = [];

  if (winner !== qrData.player1 && winner !== qrData.player2) {
    errors.push('Winner must be one of the players');
  }

  if (player1Hits < 0 || player2Hits < 0) {
    errors.push('Hit counts cannot be negative');
  }

  if (!Number.isInteger(player1Hits) || !Number.isInteger(player2Hits)) {
    errors.push('Hit counts must be integers');
  }

  if (qrData.requireSubmitterIdentity && !deviceToken) {
    errors.push('Device registration required for this tournament');
  }

  return errors;
}
```

---

## Testing Your Integration

### 1. Development Environment Setup

1. Clone the tournament app repository
2. Run local development server: `npm run dev`
3. Access at `http://localhost:3000`

### 2. Test QR Code Generation

1. Log in as admin (create user with `role: "admin"`)
2. Create a test tournament
3. Generate QR code for a match
4. Scan with your app or copy JSON manually

### 3. Test Device Registration

```bash
curl -X POST http://localhost:3000/api/submitter/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User"}'
```

Expected response:
```json
{
  "deviceToken": "...",
  "name": "Test User",
  "message": "Device registered successfully"
}
```

### 4. Test Match Submission

```bash
curl -X POST http://localhost:3000/api/qr-match/submit \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "your_match_id",
    "player1_hits": 5,
    "player2_hits": 3,
    "winner": "Player Name"
  }'
```

---

## FAQ

### Q: Can I reuse a match ID for multiple submissions?

**A**: No. Match IDs are single-use only. After the first successful submission, the match ID is removed from the system and subsequent submissions will return a `404` error.

### Q: What happens if I update a match with different results?

**A**: If the match already exists in the database, it will be updated with the new results. The latest submission overwrites previous data.

### Q: Is device registration permanent?

**A**: Yes. Once a device is registered, the token never expires unless manually deleted from the database. Users only need to register once.

### Q: Can I use the same device token across multiple tournaments?

**A**: Yes. Device tokens are user/device-specific, not tournament-specific. The same token can be used for any tournament that requires submitter identity.

### Q: What if I scan a QR code from a different tournament system?

**A**: The `submitUrl` field contains the full endpoint URL including the domain. Your app should dynamically use this URL rather than hardcoding the API endpoint.

### Q: Do I need to store the entire QR data or just the match ID?

**A**: You need to store the entire QR data object until submission, as you'll need the `submitUrl`, player names (for validation), and `requireSubmitterIdentity` flag.

### Q: What's the maximum length for player names?

**A**: Player names in the tournament system have a maximum length of 16 characters.

### Q: Can I submit results for matches not generated via QR codes?

**A**: No. This API is specifically for QR-generated matches. Regular match entry must be done through the tournament app's web interface.

---

## Support and Contact

For technical support, bug reports, or feature requests:

- **GitHub Issues**: https://github.com/cy6erskunk/tournament-app/issues
- **Documentation**: See `README.md` in the repository

---

## Changelog

### Version 1.1 (Current)
- Added audit trail support with device registration
- Added `requireSubmitterIdentity` flag to QR codes
- Enhanced CORS configuration
- Improved error messages

### Version 1.0
- Initial QR match submission system
- Basic match result API
- CORS support for cross-origin requests
