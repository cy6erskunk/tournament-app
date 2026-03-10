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

```
 User              Browser            API (/api/login)       Database
  │                   │                     │                    │
  │  Enter creds      │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │  POST {user, pass}  │                    │
  │                   ├────────────────────►│                    │
  │                   │                     │  SELECT user       │
  │                   │                     ├───────────────────►│
  │                   │                     │  user record       │
  │                   │                     │◄───────────────────┤
  │                   │                     │                    │
  │                   │                     │  bcrypt.compare()  │
  │                   │                     │  (verify password) │
  │                   │                     │                    │
  │                   │  Set-Cookie: token  │                    │
  │                   │  (JWT, HTTP-only)   │                    │
  │                   │◄────────────────────┤                    │
  │                   │                     │                    │
  │  Redirect to      │                     │                    │
  │  /select           │                     │                    │
  │◄──────────────────┤                     │                    │
```

### Session Verification (on every API call)

```
 Browser            API Route           getSession()         JWT
  │                   │                     │                  │
  │  Request +        │                     │                  │
  │  Cookie: token    │                     │                  │
  ├──────────────────►│                     │                  │
  │                   │  Extract cookie     │                  │
  │                   ├────────────────────►│                  │
  │                   │                     │  jwt.verify()    │
  │                   │                     ├─────────────────►│
  │                   │                     │  {name, role}    │
  │                   │                     │◄─────────────────┤
  │                   │  session or null    │                  │
  │                   │◄────────────────────┤                  │
  │                   │                     │                  │
  │                   │  if null → 401      │                  │
  │                   │  if !admin → 403    │                  │
  │  Response         │                     │                  │
  │◄──────────────────┤                     │                  │
```

---

## Tournament Lifecycle

### Creating a Tournament

```
 Admin              NewTournament       API                  Database
  │                   │                  │                     │
  │  Select format    │                  │                     │
  │  (RR / Bracket)   │                  │                     │
  ├──────────────────►│                  │                     │
  │                   │                  │                     │
  │  Enter name,      │                  │                     │
  │  set options      │                  │                     │
  ├──────────────────►│                  │                     │
  │                   │                  │                     │
  │  Click Create     │                  │                     │
  ├──────────────────►│                  │                     │
  │                   │  POST /api/      │                     │
  │                   │  tournament/name │                     │
  │                   ├─────────────────►│                     │
  │                   │                  │  INSERT tournament  │
  │                   │                  ├────────────────────►│
  │                   │                  │  {id, name, ...}    │
  │                   │                  │◄────────────────────┤
  │                   │  201 Created     │                     │
  │                   │◄─────────────────┤                     │
  │                   │                  │                     │
  │  Navigate to      │                  │                     │
  │  /tournament/{id} │                  │                     │
  │◄──────────────────┤                  │                     │
```

### Loading a Tournament Page

```
 Browser            Server Component    TournamentContext     Database
  │                   │                     │                    │
  │  GET /fi/         │                     │                    │
  │  tournament/5     │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │  SSR: check auth    │                    │
  │                   │  + fetch tournament │                    │
  │                   ├─────────────────────────────────────────►│
  │                   │  tournament data    │                    │
  │                   │◄─────────────────────────────────────────┤
  │                   │                     │                    │
  │  Render page      │                     │                    │
  │  (hydrate)        │                     │                    │
  │◄──────────────────┤                     │                    │
  │                   │                     │                    │
  │  Context mounts   │  Fetch players,     │                    │
  │                   │  pools              │                    │
  │                   ├────────────────────►│                    │
  │                   │                     │  GET /api/         │
  │                   │                     │  tournament/5/     │
  │                   │                     │  players + pools   │
  │                   │                     ├───────────────────►│
  │                   │                     │  data              │
  │                   │                     │◄───────────────────┤
  │                   │                     │                    │
  │                   │                     │  [RR only]         │
  │                   │                     │  If no pools:      │
  │                   │                     │  auto-create       │
  │                   │                     │  "Pool 1"          │
  │                   │                     │                    │
  │  Re-render with   │                     │                    │
  │  full data        │                     │                    │
  │◄──────────────────┤                     │                    │
```

---

## Round-Robin Match Entry

### Single Match Entry

```
 Admin              AddMatch            API (/api/matches)   Database
  │                   │                     │                    │
  │  Click "+" on     │                     │                    │
  │  player cell      │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │  Player 1 & 2     │                     │                    │
  │  pre-filled       │                     │                    │
  │◄──────────────────┤                     │                    │
  │                   │                     │                    │
  │  Enter hit counts │                     │                    │
  │  (e.g., 5-3)      │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │  [If tied: select │                     │                    │
  │   priority winner]│                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │  Click Submit     │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │  POST {player1,     │                    │
  │                   │   player2, hits,    │                    │
  │                   │   winner, round,    │                    │
  │                   │   tournament_id}    │                    │
  │                   ├────────────────────►│                    │
  │                   │                     │  INSERT match      │
  │                   │                     ├───────────────────►│
  │                   │                     │  match row         │
  │                   │                     │◄───────────────────┤
  │                   │  200 + match data   │                    │
  │                   │◄────────────────────┤                    │
  │                   │                     │                    │
  │                   │  Update context     │                    │
  │                   │  (players state)    │                    │
  │                   │                     │                    │
  │  Table updates    │                     │                    │
  │  with result      │                     │                    │
  │◄──────────────────┤                     │                    │
```

### Match Editing

```
 Admin              EditMatch           API (/api/matches)   Database
  │                   │                     │                    │
  │  Click existing   │                     │                    │
  │  match result     │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │  Form shows       │                     │                    │
  │  current data     │                     │                    │
  │◄──────────────────┤                     │                    │
  │                   │                     │                    │
  │  Modify hits      │                     │                    │
  │  Click Save       │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │  PUT {match data}   │                    │
  │                   ├────────────────────►│                    │
  │                   │                     │  UPDATE match      │
  │                   │                     ├───────────────────►│
  │                   │  200 + updated      │                    │
  │                   │◄────────────────────┤                    │
  │                   │                     │                    │
  │  ── OR ──         │                     │                    │
  │                   │                     │                    │
  │  Click Delete     │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │  DELETE {match}     │                    │
  │                   ├────────────────────►│                    │
  │                   │                     │  DELETE match      │
  │                   │                     ├───────────────────►│
  │                   │  200               │                    │
  │                   │◄────────────────────┤                    │
```

---

## Bracket Tournament Seeding

```
 Admin              Seed API            Database
  │                   │                    │
  │  Click "Seed      │                    │
  │  from tournament" │                    │
  ├──────────────────►│                    │
  │                   │                    │
  │  GET /api/        │                    │
  │  tournament/      │                    │
  │  {srcId}/seed/    │                    │
  │  {targetId}       │                    │
  ├──────────────────►│                    │
  │                   │  Fetch players +   │
  │                   │  matches from src  │
  │                   ├───────────────────►│
  │                   │  player data       │
  │                   │◄───────────────────┤
  │                   │                    │
  │                   │  Sort by win%      │
  │                   │  (descending)      │
  │                   │                    │
  │                   │  Calculate bracket │
  │                   │  positions + byes  │
  │                   │                    │
  │                   │  INSERT            │
  │                   │  tournament_players│
  │                   │  with bracket_match│
  │                   │  and bracket_seed  │
  │                   ├───────────────────►│
  │                   │                    │
  │  Seeded bracket   │                    │
  │  data             │                    │
  │◄──────────────────┤                    │
  │                   │                    │
  │  Bracket view     │                    │
  │  renders matches  │                    │
```

---

## QR Code Match Flow

This is the complete lifecycle of a QR-code-based match:

```
 Admin             QRMatchModal       Generate API       In-Memory Store
  │                   │                   │                    │
  │  Click "QR Match" │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │                   │                    │
  │  Select players   │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │                   │                    │
  │  Click Generate   │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │  POST /api/       │                    │
  │                   │  qr-match/        │                    │
  │                   │  generate         │                    │
  │                   ├──────────────────►│                    │
  │                   │                   │  Generate matchId  │
  │                   │                   │  Store metadata    │
  │                   │                   │  (1hr expiry)      │
  │                   │                   ├───────────────────►│
  │                   │                   │                    │
  │                   │  {matchId,        │                    │
  │                   │   submitUrl, ...} │                    │
  │                   │◄──────────────────┤                    │
  │                   │                   │                    │
  │  QR code          │                   │                    │
  │  displayed        │                   │                    │
  │◄──────────────────┤                   │                    │


 External Device                       Submit API         In-Memory Store    Database
  │                                       │                    │               │
  │  Scan QR code                         │                    │               │
  │  Extract matchId + submitUrl          │                    │               │
  │                                       │                    │               │
  │  POST /api/qr-match/submit           │                    │               │
  │  {matchId, hits, winner,             │                    │               │
  │   deviceToken?}                       │                    │               │
  ├──────────────────────────────────────►│                    │               │
  │                                       │  Lookup matchId    │               │
  │                                       ├───────────────────►│               │
  │                                       │  match metadata    │               │
  │                                       │◄───────────────────┤               │
  │                                       │                    │               │
  │                                       │  [If identity      │               │
  │                                       │   required]        │               │
  │                                       │  Validate device   │               │
  │                                       │  token             │               │
  │                                       ├────────────────────────────────────►│
  │                                       │  device record     │               │
  │                                       │◄────────────────────────────────────┤
  │                                       │                    │               │
  │                                       │  Zod validation    │               │
  │                                       │  (hits, winner)    │               │
  │                                       │                    │               │
  │                                       │  Upsert match      │               │
  │                                       ├────────────────────────────────────►│
  │                                       │  match row         │               │
  │                                       │◄────────────────────────────────────┤
  │                                       │                    │               │
  │                                       │  Remove from store │               │
  │                                       ├───────────────────►│               │
  │                                       │                    │               │
  │  {success: true, match}               │                    │               │
  │◄──────────────────────────────────────┤                    │               │
```

---

## Device Registration Flow

```
 External App                          Register API         Database
  │                                       │                    │
  │  POST /api/submitter/register         │                    │
  │  {name: "Referee Tablet 1"}           │                    │
  ├──────────────────────────────────────►│                    │
  │                                       │                    │
  │                                       │  Generate token    │
  │                                       │  (crypto random)   │
  │                                       │                    │
  │                                       │  INSERT device     │
  │                                       ├───────────────────►│
  │                                       │  device row        │
  │                                       │◄───────────────────┤
  │                                       │                    │
  │  201 {deviceToken, name, message}     │                    │
  │◄──────────────────────────────────────┤                    │
  │                                       │                    │
  │  Store token locally for              │                    │
  │  future QR match submissions          │                    │
```

---

## Pool Management Flow

```
 Admin              PoolManagement      Pool API             Database
  │                   │                   │                    │
  │  Open Pool        │                   │                    │
  │  Management       │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │                   │                    │
  │  Click "Add Pool" │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │  POST /api/       │                    │
  │                   │  tournament/5/    │                    │
  │                   │  pools            │                    │
  │                   ├──────────────────►│                    │
  │                   │                   │  INSERT pool       │
  │                   │                   │  (auto-name)       │
  │                   │                   ├───────────────────►│
  │                   │  {id, name}       │                    │
  │                   │◄──────────────────┤                    │
  │                   │                   │                    │
  │  Pool "Pool 2"    │                   │                    │
  │  appears          │                   │                    │
  │◄──────────────────┤                   │                    │
  │                   │                   │                    │
  │  Assign player    │                   │                    │
  │  to Pool 2        │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │  POST /api/       │                    │
  │                   │  tournament/5/    │                    │
  │                   │  pools/2/players  │                    │
  │                   │  {playerName}     │                    │
  │                   ├──────────────────►│                    │
  │                   │                   │  UPDATE            │
  │                   │                   │  tournament_players│
  │                   │                   │  SET pool_id = 2   │
  │                   │                   ├───────────────────►│
  │                   │  200 OK           │                    │
  │                   │◄──────────────────┤                    │
  │                   │                   │                    │
  │  Player moves     │                   │                    │
  │  to Pool 2 table  │                   │                    │
  │◄──────────────────┤                   │                    │
```

---

## Bulk Match Entry Flow

```
 Admin              BulkMatchEntry      API (/api/matches)   Database
  │                   │                     │                    │
  │  Click "DT Entry" │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │  Matrix table     │                     │                    │
  │  with hit inputs  │                     │                    │
  │◄──────────────────┤                     │                    │
  │                   │                     │                    │
  │  Fill in hit      │                     │                    │
  │  counts for       │                     │                    │
  │  each matchup     │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │  [If any draws]   │                     │                    │
  │  Select priority  │                     │                    │
  │  winners          │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │  Click Submit All │                     │                    │
  ├──────────────────►│                     │                    │
  │                   │                     │                    │
  │                   │  For each match:    │                    │
  │                   │  POST {match data}  │                    │
  │                   ├────────────────────►│                    │
  │                   │                     │  INSERT match      │
  │                   │                     ├───────────────────►│
  │                   │  200               │                    │
  │                   │◄────────────────────┤                    │
  │                   │  ... repeat ...     │                    │
  │                   │                     │                    │
  │  All matches      │                     │                    │
  │  saved            │                     │                    │
  │◄──────────────────┤                     │                    │
```

---

## Admin User Management Flow

```
 Admin              UserManagement      Admin API            Database
  │                   │                   │                    │
  │  Navigate to      │                   │                    │
  │  /admin/users     │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │  GET /api/admin/  │                    │
  │                   │  users            │                    │
  │                   ├──────────────────►│                    │
  │                   │                   │  SELECT * users    │
  │                   │                   ├───────────────────►│
  │                   │  [{username,      │                    │
  │                   │    role}, ...]     │                    │
  │                   │◄──────────────────┤                    │
  │                   │                   │                    │
  │  User table       │                   │                    │
  │  displayed        │                   │                    │
  │◄──────────────────┤                   │                    │
  │                   │                   │                    │
  │  ── Create ──     │                   │                    │
  │                   │                   │                    │
  │  Click Create     │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │                   │                    │
  │  Fill modal       │                   │                    │
  │  (user/pass/role) │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │  POST /api/admin/ │                    │
  │                   │  users            │                    │
  │                   │  {username,       │                    │
  │                   │   password, role} │                    │
  │                   ├──────────────────►│                    │
  │                   │                   │  bcrypt hash       │
  │                   │                   │  INSERT user       │
  │                   │                   ├───────────────────►│
  │                   │  201 Created      │                    │
  │                   │◄──────────────────┤                    │
  │                   │                   │                    │
  │  Table refreshes  │                   │                    │
  │◄──────────────────┤                   │                    │
  │                   │                   │                    │
  │  ── Delete ──     │                   │                    │
  │                   │                   │                    │
  │  Click Delete     │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │                   │                    │
  │  Confirm in modal │                   │                    │
  ├──────────────────►│                   │                    │
  │                   │  DELETE /api/     │                    │
  │                   │  admin/users/     │                    │
  │                   │  {username}       │                    │
  │                   ├──────────────────►│                    │
  │                   │                   │  Check: not last   │
  │                   │                   │  admin             │
  │                   │                   │  DELETE user       │
  │                   │                   ├───────────────────►│
  │                   │  200 OK           │                    │
  │                   │◄──────────────────┤                    │
```

---

## Component Rendering Flow

### Tournament Page Component Tree

```
Layout (UserContextProvider)
  │
  └── TournamentPage (SSR auth check)
        │
        └── TournamentContextProvider
              │
              ├── Navbar
              │   ├── Languages (locale selector)
              │   ├── AdminNavLink (if admin)
              │   ├── TournamentNavbarContent
              │   │   ├── "Back to tournaments" link
              │   │   └── "New Player" button → NewPlayer modal
              │   └── Logout/Login button
              │
              ├── TournamentButtons
              │   ├── Leaderboard toggle
              │   ├── QR Match button → QRMatchModal
              │   ├── DT Entry button → BulkMatchEntry
              │   └── Pool Management → PoolManagement modal
              │
              ├── Leaderboard (toggleable)
              │   └── LeaderboardPlayer (for each player)
              │
              └── TournamentInfo
                    │
                    ├── [Round Robin]
                    │   ├── Rounds (round navigation)
                    │   ├── PoolTable (per pool)
                    │   │   └── Player (row per player)
                    │   │       └── Match cells (clickable)
                    │   └── LeaderboardSidebar
                    │
                    └── [Bracket]
                        ├── Round navigation
                        └── Round
                            └── Match (per matchup)
```
