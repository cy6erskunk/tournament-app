# Architecture Overview

This document describes the high-level architecture of the Tournament App, a full-stack Next.js application for managing fencing tournaments for Helsingin Miekkailijat (Helsinki Fencers).

## System Architecture

```mermaid
graph TD
    subgraph Client["Client (Browser)"]
        UI["React 19 UI Components"]
        I18N["next-intl (i18n)"]
        CTX["React Context (State)<br/>- TournamentContext<br/>- UserContext"]
    end

    subgraph Server["Next.js 16 Server (App Router)"]
        API["API Routes /api/*"]
        MW["Middleware (auth, i18n)"]
        SSR["Server Components (SSR pages)"]
        DB_SVC["Database Services"]
        AUTH["Auth (JWT + bcrypt)"]
        QR_STORE["QR Match In-Memory Store"]
    end

    subgraph Database["PostgreSQL (Neon)"]
        TABLES["Tables: users, tournaments, players,<br/>tournament_players, matches, pools,<br/>submitter_devices"]
    end

    EXT["External QR Scanner<br/>(CORS-enabled)"]

    UI -->|"HTTP (fetch)"| API
    API --> DB_SVC
    DB_SVC -->|"SQL (Kysely ORM)"| TABLES
    EXT -->|"POST /api/qr-match/submit"| API
```

## Tech Stack

| Layer            | Technology                                       |
|------------------|--------------------------------------------------|
| Frontend         | React 19, TypeScript, Tailwind CSS               |
| Framework        | Next.js 16 (App Router)                          |
| State Management | React Context API                                |
| i18n             | next-intl (URL-based locale routing)             |
| Backend          | Next.js API Routes                               |
| ORM              | Kysely (type-safe SQL query builder)             |
| Database         | PostgreSQL (hosted on Neon)                      |
| Auth             | JWT tokens (HTTP-only cookies) + bcrypt          |
| QR Codes         | qrcode library                                   |
| Testing          | Vitest + @testing-library/react                  |
| Runtime          | Node.js 24+                                      |
| Deployment       | Vercel                                           |

## Directory Structure

```
tournament-app/
├── docs/                       # Documentation (this directory)
├── migrations/                 # Database migrations (TypeScript, auto-numbered)
│   ├── 001_initial.ts
│   ├── 002_*.ts
│   └── ...
├── scripts/                    # Utility scripts (migration generator)
├── src/
│   ├── app/
│   │   ├── [locale]/           # Internationalized pages
│   │   │   ├── layout.tsx      # Root layout (i18n + UserContext providers)
│   │   │   ├── page.tsx        # Home / login page
│   │   │   ├── select/         # Tournament selection page
│   │   │   ├── tournament/
│   │   │   │   └── [id]/       # Individual tournament page
│   │   │   └── admin/          # Admin panel (protected)
│   │   │       ├── layout.tsx  # Admin auth guard
│   │   │       ├── users/      # User management
│   │   │       ├── devices/    # Device management
│   │   │       ├── players/    # Global player management
│   │   │       └── qr-audit/   # QR submission audit logs
│   │   └── api/                # REST API endpoints
│   │       ├── matches/        # Match CRUD
│   │       ├── newplayer/      # Create player
│   │       ├── addplayer/      # Add player to tournament
│   │       ├── removeplayer/   # Remove player from tournament
│   │       ├── tournament/     # Tournament operations
│   │       │   └── [tournamentId]/
│   │       │       ├── players/    # Tournament players
│   │       │       ├── pools/      # Pool management
│   │       │       └── seed/       # Bracket seeding
│   │       ├── qr-match/       # QR code match system
│   │       │   ├── generate/   # Generate QR match
│   │       │   └── submit/     # Submit QR match results (CORS)
│   │       ├── submitter/      # Device registration (CORS)
│   │       └── admin/          # Admin API endpoints
│   │           ├── users/      # User CRUD
│   │           ├── devices/    # Device management
│   │           ├── players/    # Player CRUD
│   │           └── qr-audit/   # Audit log retrieval
│   ├── components/             # React components
│   │   ├── Admin/              # Admin panel components
│   │   ├── Leaderboards/       # Rankings display
│   │   └── Results/            # Tournament result views
│   │       ├── Brackets/       # Bracket tournament display
│   │       └── RoundRobin/     # Round-robin tournament display
│   ├── context/                # React Context providers
│   │   ├── TournamentContext.tsx
│   │   └── UserContext.tsx
│   ├── database/               # Database service layer
│   ├── helpers/                # Utility functions
│   ├── languages/              # Translation files (fi, en, se, ee)
│   └── types/                  # TypeScript type definitions
├── docker-compose.yaml         # Local PostgreSQL + Adminer
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vitest.config.ts
```

## Database Schema

```mermaid
erDiagram
    users {
        varchar username PK
        varchar password
        varchar role
    }

    tournaments {
        serial id PK
        varchar name
        date date
        varchar format
        boolean public_results
        boolean require_submitter_identity
    }

    players {
        varchar player_name PK
    }

    tournament_players {
        varchar player_name FK
        integer tournament_id FK
        integer bracket_match
        integer bracket_seed
        integer pool_id FK "nullable"
    }

    matches {
        serial id PK
        integer tournament_id
        integer round
        integer match
        varchar player1
        varchar player2
        integer player1_hits
        integer player2_hits
        varchar winner
        varchar submitted_by_token FK "nullable"
        timestamp submitted_at
    }

    pools {
        serial id PK
        integer tournament_id FK
        varchar name
    }

    submitter_devices {
        varchar device_token PK
        varchar submitter_name
        timestamp created_at
        timestamp last_used
    }

    tournaments ||--o{ tournament_players : "has"
    players ||--o{ tournament_players : "joins"
    tournaments ||--o{ pools : "has"
    tournaments ||--o{ matches : "contains"
    pools ||--o{ tournament_players : "groups"
    submitter_devices ||--o{ matches : "submits"
```

### Table Relationships

- **users**: Standalone table for authentication. No FK relationships.
- **tournaments**: Central entity. Referenced by matches, tournament_players, and pools.
- **players**: Global player registry. Referenced by tournament_players.
- **tournament_players**: Join table linking players to tournaments. Holds bracket positioning and pool assignment.
- **matches**: Records individual match results within a tournament.
- **pools**: Groups within round-robin tournaments. Players are assigned to pools via tournament_players.pool_id.
- **submitter_devices**: Registered external devices for QR match submission. Referenced by matches.submitted_by_token.

## Authentication Architecture

```mermaid
sequenceDiagram
    participant C as Client
    participant L as Login API
    participant A as API Route
    participant J as JWT Verify

    C->>L: POST /api/login {username, password}
    L->>L: bcrypt.compare()
    L-->>C: Set-Cookie: token=JWT (HTTP-only)

    Note over C: Subsequent requests include cookie automatically

    C->>A: Request + Cookie: token
    A->>J: getSession()
    J->>J: jwt.verify()
    J-->>A: {name, role} or null
    alt No session
        A-->>C: 401 Unauthorized
    else Not admin
        A-->>C: 403 Forbidden
    else Valid
        A-->>C: Response
    end
```

- **JWT tokens** are stored in HTTP-only cookies for security (not accessible to JavaScript).
- **Password hashing** uses bcrypt for secure storage.
- **Role-based access**: Two roles (`admin`, `user`). Admin routes check `role === "admin"`.
- **Session helper** (`getSession()`) extracts and verifies JWT from the cookie on each API call.

## State Management

The app uses React Context for global state, with two primary providers:

### UserContext
- Holds authenticated user info (`name`, `role`)
- Fetched on app mount via `getSession()`
- Used by navbar, admin guards, and permission checks

### TournamentContext
- Holds current tournament data, players, pools, and UI state
- Fetched when a tournament page loads
- Provides: `tournament`, `players`, `pools`, `activeRound`, `hidden` (leaderboard toggle)
- Auto-creates "Pool 1" for round-robin tournaments with no pools

```mermaid
graph TD
    UCP["UserContextProvider (layout.tsx)"]
    TCP["TournamentContextProvider (tournament/[id]/page.tsx)"]
    TI["TournamentInfo"]
    RR["RoundRobin/Tournament or Brackets/Tournament"]
    LB["Leaderboard"]
    LBS["LeaderboardSidebar"]
    TB["TournamentButtons"]
    MOD["Modals (AddMatch, EditMatch, QRMatch, PoolManagement)"]

    UCP --> TCP
    TCP --> TI
    TCP --> TB
    TCP --> MOD
    TI --> RR
    TI --> LB
    TI --> LBS
```

## Internationalization

The app supports 4 languages via `next-intl` with URL-based routing:

| Locale | Language | URL Prefix |
|--------|----------|------------|
| `fi`   | Finnish  | `/fi/...`  |
| `en`   | English  | `/en/...`  |
| `se`   | Swedish  | `/se/...`  |
| `ee`   | Estonian | `/ee/...`  |

- Finnish (`fi.json`) is the **source of truth** for TypeScript types
- Middleware handles locale detection and routing
- All UI text uses `useTranslations()` hook with namespace-based keys

## Deployment Architecture

```mermaid
graph LR
    DEV["Developer<br/>git push"] --> VERCEL["Vercel<br/>1. Build<br/>2. Run tests<br/>3. Deploy<br/>4. Run migrations (postbuild)"]
    VERCEL --> NEON["Neon DB<br/>PostgreSQL (serverless)"]
```

- **Vercel** hosts the Next.js application with automatic deployments on push
- **Neon** provides serverless PostgreSQL with connection pooling
- **Migrations** run automatically after successful builds via the `postbuild` script
- **Environment variables** (`POSTGRES_URL`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`) are configured in Vercel dashboard

## Key Design Decisions

1. **Kysely over Prisma**: Chosen for type-safe SQL queries without a heavy ORM abstraction, giving more control over query construction.

2. **React Context over Redux**: Simpler state management suitable for the app's scope. Two focused contexts rather than a monolithic store.

3. **URL-based i18n**: Locale in URL path (`/fi/`, `/en/`) enables proper SEO and shareable localized URLs.

4. **In-memory QR match store**: QR match metadata is stored in-memory with 1-hour expiration rather than in the database, keeping the system simple for short-lived match sessions.

5. **HTTP-only JWT cookies**: Prevents XSS attacks from accessing auth tokens while maintaining stateless authentication.

6. **Feature-based component organization**: Components grouped by feature (Admin, Leaderboards, Results) rather than by type (buttons, forms), making related code easy to find.
