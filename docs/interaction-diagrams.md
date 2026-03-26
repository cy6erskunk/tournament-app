# Interaction Diagrams

This document illustrates the key interaction flows in the Tournament App using sequence diagrams in ASCII art.

## Table of Contents

- [Authentication Flow](#authentication-flow)
- [Tournament Lifecycle](#tournament-lifecycle)
- [Round-Robin Match Entry](#round-robin-match-entry)
- [Bracket Tournament Seeding](#bracket-tournament-seeding)
- [QR Code Match Flow](#qr-code-match-flow)
- [Device Registration Flow](#device-registration-flow)
- [Pool Management Flow](#pool-management-flow)
- [Bulk Match Entry Flow](#bulk-match-entry-flow)

---

## Authentication Flow

### Login

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant API as API (/api/login)
    participant DB as Database

    User->>Browser: Enter credentials
    Browser->>API: POST {username, password}
    API->>DB: SELECT user
    DB-->>API: user record
    API->>API: bcrypt.compare() (verify password)
    API-->>Browser: Set-Cookie: token (JWT, HTTP-only)
    Browser-->>User: Redirect to /select
```

### Session Verification (on every API call)

```mermaid
sequenceDiagram
    participant Browser
    participant API as API Route
    participant GS as getSession()
    participant JWT

    Browser->>API: Request + Cookie: token
    API->>GS: Extract cookie
    GS->>JWT: jwt.verify()
    JWT-->>GS: {name, role}
    GS-->>API: session or null
    alt null
        API-->>Browser: 401 Unauthorized
    else !admin
        API-->>Browser: 403 Forbidden
    else valid
        API-->>Browser: Response
    end
```

---

## Tournament Lifecycle

### Creating a Tournament

```mermaid
sequenceDiagram
    actor Admin
    participant NT as NewTournament
    participant API
    participant DB as Database

    Admin->>NT: Select format (RR / Bracket)
    Admin->>NT: Enter name, set options
    Admin->>NT: Click Create
    NT->>API: POST /api/tournament/name
    API->>DB: INSERT tournament
    DB-->>API: {id, name, format, ...}
    Note over API,DB: Create rounds for the new tournament
    alt Round Robin
        API->>DB: INSERT rounds (round_order=1, type='pools')
        API->>DB: INSERT rounds (round_order=2, type='pools')
        API->>DB: INSERT pool "Pool 1"
    else Brackets
        API->>DB: INSERT rounds (round_order=1, type='elimination')
    end
    API-->>NT: 201 Created
    NT-->>Admin: Navigate to /tournament/{id}
```

### Loading a Tournament Page

```mermaid
sequenceDiagram
    participant Browser
    participant SC as Server Component
    participant TC as TournamentContext
    participant DB as Database

    Browser->>SC: GET /fi/tournament/5
    SC->>DB: SSR: check auth + fetch tournament
    DB-->>SC: tournament data
    SC-->>Browser: Render page (hydrate)

    Note over Browser,TC: Context mounts (client-side)

    SC->>TC: Fetch players, pools, rounds
    TC->>DB: GET /api/tournament/5/players + pools + rounds
    DB-->>TC: data

    opt RR only — no pools exist
        TC->>TC: Auto-create "Pool 1"
    end

    TC-->>Browser: Re-render with full data
```

---

## Round-Robin Match Entry

### Single Match Entry

```mermaid
sequenceDiagram
    actor Admin
    participant AM as AddMatch
    participant API as API (/api/matches)
    participant DB as Database

    Admin->>AM: Click "+" on player cell
    AM-->>Admin: Player 1 & 2 pre-filled
    Admin->>AM: Enter hit counts (e.g., 5-3)
    opt If tied
        Admin->>AM: Select priority winner
    end
    Admin->>AM: Click Submit
    AM->>API: POST {player1, player2, hits, winner, round, tournament_id}
    API->>DB: INSERT match
    DB-->>API: match row
    API-->>AM: 200 + match data
    AM->>AM: Update context (players state)
    AM-->>Admin: Table updates with result
```

### Match Editing

```mermaid
sequenceDiagram
    actor Admin
    participant EM as EditMatch
    participant API as API (/api/matches)
    participant DB as Database

    Admin->>EM: Click existing match result
    EM-->>Admin: Form shows current data
    alt Save
        Admin->>EM: Modify hits, Click Save
        EM->>API: PUT {match data}
        API->>DB: UPDATE match
        API-->>EM: 200 + updated
    else Delete
        Admin->>EM: Click Delete
        EM->>API: DELETE {match}
        API->>DB: DELETE match
        API-->>EM: 200
    end
```

---

## Bracket Tournament Seeding

```mermaid
sequenceDiagram
    actor Admin
    participant API as Seed API
    participant DB as Database

    Admin->>API: Click "Seed from tournament"
    Admin->>API: GET /api/tournament/{srcId}/seed/{targetId}
    API->>DB: Fetch players + matches from source
    DB-->>API: player data
    API->>API: Sort by win% (descending)
    API->>API: Calculate bracket positions + byes
    API->>DB: INSERT tournament_players with bracket_match and bracket_seed
    API-->>Admin: Seeded bracket data
    Note over Admin: Bracket view renders matches
```

---

## QR Code Match Flow

This is the complete lifecycle of a QR-code-based match:

```mermaid
sequenceDiagram
    actor Admin
    participant QRM as QRMatchModal
    participant GEN as Generate API
    participant MEM as In-Memory Store

    Admin->>QRM: Click "QR Match"
    Admin->>QRM: Select players
    Admin->>QRM: Click Generate
    QRM->>GEN: POST /api/qr-match/generate
    GEN->>MEM: Generate matchId, store metadata (1hr expiry)
    GEN-->>QRM: {matchId, submitUrl, ...}
    QRM-->>Admin: QR code displayed
```

```mermaid
sequenceDiagram
    participant EXT as External Device
    participant SUB as Submit API
    participant MEM as In-Memory Store
    participant DB as Database

    EXT->>EXT: Scan QR code, extract matchId + submitUrl
    EXT->>SUB: POST /api/qr-match/submit {matchId, hits, winner, deviceToken?}
    SUB->>MEM: Lookup matchId
    MEM-->>SUB: match metadata

    opt Identity required
        SUB->>DB: Validate device token
        DB-->>SUB: device record
    end

    SUB->>SUB: Zod validation (hits, winner)
    SUB->>DB: Upsert match
    DB-->>SUB: match row
    SUB->>MEM: Remove from store
    SUB-->>EXT: {success: true, match}
```

---

## Device Registration Flow

```mermaid
sequenceDiagram
    participant EXT as External App
    participant API as Register API
    participant DB as Database

    EXT->>API: POST /api/submitter/register {name: "Referee Tablet 1"}
    API->>API: Generate token (crypto random)
    API->>DB: INSERT device
    DB-->>API: device row
    API-->>EXT: 201 {deviceToken, name, message}
    Note over EXT: Store token locally for future QR match submissions
```

---

## Pool Management Flow

```mermaid
sequenceDiagram
    actor Admin
    participant PM as PoolManagement
    participant API as Pool API
    participant DB as Database

    Admin->>PM: Open Pool Management
    Admin->>PM: Click "Add Pool"
    PM->>API: POST /api/tournament/5/pools
    API->>DB: INSERT pool (auto-name)
    API-->>PM: {id, name}
    PM-->>Admin: Pool "Pool 2" appears

    Admin->>PM: Assign player to Pool 2
    PM->>API: POST /api/tournament/5/pools/2/players {playerName}
    API->>DB: UPDATE tournament_players SET pool_id = 2
    API-->>PM: 200 OK
    PM-->>Admin: Player moves to Pool 2 table
```

---

## Bulk Match Entry Flow

```mermaid
sequenceDiagram
    actor Admin
    participant BME as BulkMatchEntry
    participant API as API (/api/matches)
    participant DB as Database

    Admin->>BME: Click "DT Entry"
    BME-->>Admin: Matrix table with hit inputs
    Admin->>BME: Fill in hit counts for each matchup
    opt Any draws
        Admin->>BME: Select priority winners
    end
    Admin->>BME: Click Submit All

    loop For each match
        BME->>API: POST {match data}
        API->>DB: INSERT match
        API-->>BME: 200
    end

    BME-->>Admin: All matches saved
```

---

## Admin User Management Flow

```mermaid
sequenceDiagram
    actor Admin
    participant UM as UserManagement
    participant API as Admin API
    participant DB as Database

    Admin->>UM: Navigate to /admin/users
    UM->>API: GET /api/admin/users
    API->>DB: SELECT * users
    DB-->>API: user rows
    API-->>UM: [{username, role}, ...]
    UM-->>Admin: User table displayed

    rect rgb(240, 248, 255)
        Note over Admin,DB: Create User
        Admin->>UM: Click Create
        Admin->>UM: Fill modal (user/pass/role)
        UM->>API: POST /api/admin/users {username, password, role}
        API->>API: bcrypt hash
        API->>DB: INSERT user
        API-->>UM: 201 Created
        UM-->>Admin: Table refreshes
    end

    rect rgb(255, 240, 240)
        Note over Admin,DB: Delete User
        Admin->>UM: Click Delete
        Admin->>UM: Confirm in modal
        UM->>API: DELETE /api/admin/users/{username}
        API->>API: Check: not last admin
        API->>DB: DELETE user
        API-->>UM: 200 OK
    end
```

---

## Component Rendering Flow

### Tournament Page Component Tree

```mermaid
graph TD
    Layout["Layout (UserContextProvider)"]
    TP["TournamentPage (SSR auth check)"]
    TCP["TournamentContextProvider"]

    Layout --> TP --> TCP

    TCP --> Navbar
    TCP --> TB["TournamentButtons"]
    TCP --> LB["Leaderboard (toggleable)"]
    TCP --> TI["TournamentInfo"]

    Navbar --> Lang["Languages (locale selector)"]
    Navbar --> ANL["AdminNavLink (if admin)"]
    Navbar --> TNC["TournamentNavbarContent"]
    Navbar --> LogBtn["Logout/Login button"]
    TNC --> BackLink["Back to tournaments link"]
    TNC --> NPBtn["New Player button → NewPlayer modal"]

    TB --> LBToggle["Leaderboard toggle"]
    TB --> QRBtn["QR Match button → QRMatchModal"]
    TB --> DTBtn["DT Entry button → BulkMatchEntry"]
    TB --> PMBtn["Pool Management → PoolManagement modal"]

    LB --> LBP["LeaderboardPlayer (for each player)"]

    TI --> RR["Round Robin"]
    TI --> BR["Bracket"]

    RR --> Rounds["Rounds (round navigation)"]
    RR --> PT["PoolTable (per pool)"]
    RR --> LBS["LeaderboardSidebar"]
    PT --> Player["Player (row per player)"]
    Player --> MC["Match cells (clickable)"]

    BR --> RNav["Round navigation"]
    BR --> Round["Round"]
    Round --> Match["Match (per matchup)"]
```
