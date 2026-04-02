# Developer Guide

This guide covers everything a developer needs to set up, work with, and extend the Tournament App.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure Deep Dive](#project-structure-deep-dive)
- [Working with the Database](#working-with-the-database)
- [Working with API Routes](#working-with-api-routes)
- [Working with Components](#working-with-components)
- [State Management](#state-management)
- [Internationalization](#internationalization)
- [Authentication & Authorization](#authentication--authorization)
- [Testing](#testing)
- [Adding New Features](#adding-new-features)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 24+
- Docker (for local database)
- npm

### Initial Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd tournament-app

# 2. Install dependencies
npm install

# 3. Start the local database
docker-compose up -d

# 4. Create a .env file (see Environment Variables below)
cp .env.example .env  # or create manually

# 5. Run database migrations
npm run migrate

# 6. Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database (local Docker setup)
POSTGRES_URL=postgresql://user:password@localhost:5434/tournament

# Authentication
JWT_SECRET=your-secret-key-here

# CORS (for QR match submission)
CORS_ALLOWED_ORIGIN=http://localhost:3000

# Base URL (optional, for QR code generation)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Docker Services

The `docker-compose.yaml` provides:

| Service   | Port | Description                          |
|-----------|------|--------------------------------------|
| PostgreSQL| 5434 | Database (note: not default 5432)    |
| Adminer   | 5433 | Web-based database management UI     |

Access Adminer at `http://localhost:5433` to inspect the database directly.

---

## Development Environment

### Key Commands

```bash
npm run dev          # Start dev server (hot reload)
npm run test         # Run all tests (must pass before commits)
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run build        # Run tests + production build
npm run prod         # Run tests + build + start production
```

### Code Quality Workflow

**Before every commit:**

```bash
npm run test         # All 265+ tests must pass
npm run lint         # No lint errors
```

The build command (`npm run build`) runs tests automatically, so a successful build guarantees passing tests.

---

## Project Structure Deep Dive

### `/src/app/[locale]/` — Pages

Each page follows the Next.js App Router convention:

```
[locale]/
├── page.tsx              # Home / login page
├── layout.tsx            # Root layout (providers)
├── select/
│   └── page.tsx          # Tournament selection (authenticated)
├── tournament/
│   └── [id]/
│       └── page.tsx      # Tournament detail (context-wrapped)
└── admin/
    ├── layout.tsx        # Admin auth guard
    ├── page.tsx          # Admin dashboard
    ├── users/page.tsx    # User management
    ├── devices/page.tsx  # Device management
    ├── players/page.tsx  # Player management
    └── qr-audit/page.tsx # QR audit logs
```

**Key pattern**: The `[locale]` segment enables URL-based internationalization. All routes are prefixed with the locale (e.g., `/fi/select`, `/en/tournament/5`).

### `/src/app/api/` — API Routes

API routes follow RESTful conventions:

```
api/
├── matches/route.ts          # GET, POST, PUT, DELETE
├── newplayer/route.ts        # POST (create player + add to tournament)
├── addplayer/route.ts        # POST (add existing player to tournament)
├── removeplayer/route.ts     # POST
├── tournament/
│   ├── name/route.ts         # POST (create/update), DELETE
│   └── [tournamentId]/
│       ├── players/route.ts  # GET
│       ├── pools/
│       │   ├── route.ts      # GET, POST, DELETE
│       │   └── [poolId]/
│       │       └── players/route.ts  # POST (assign player)
│       ├── rounds/
│       │   └── route.ts      # GET, POST, DELETE (coming in Step 2)
│       └── seed/
│           └── [currentId]/route.ts  # GET
├── qr-match/
│   ├── generate/route.ts    # POST
│   └── submit/route.ts      # POST, OPTIONS (CORS)
├── submitter/
│   └── register/route.ts    # POST, OPTIONS (CORS)
└── admin/
    ├── users/
    │   ├── route.ts          # GET, POST
    │   └── [username]/route.ts  # GET, PATCH, DELETE
    ├── devices/
    │   ├── route.ts          # GET
    │   └── [deviceToken]/route.ts  # GET, DELETE
    ├── players/
    │   ├── route.ts          # GET, POST
    │   └── [name]/route.ts   # PATCH
    └── qr-audit/route.ts    # GET
```

### `/src/database/` — Data Access Layer

Each file provides functions for a specific domain:

| File                 | Functions                                                |
|----------------------|----------------------------------------------------------|
| `getPlayers.ts`      | Player queries (get, create, add to tournament, remove)  |
| `getTournaments.ts`  | Tournament CRUD operations                               |
| `getMatches.ts`      | Match CRUD (create, update, delete, get by tournament)   |
| `getPools.ts`        | Pool management (get, create, delete, assign player)     |
| `getRounds.ts`       | Round management (get, create, delete, update)           |
| `getUsers.ts`        | User management (CRUD, role updates, password changes)   |
| `getDevices.ts`      | Device management (register, list, delete)               |
| `getQRAuditLogs.ts`  | QR audit log retrieval                                   |
| `db.ts`              | Database connection setup (Kysely + Neon)                |
| `migrator.ts`        | Migration execution logic                                |

**Pattern**: Functions accept typed parameters and return typed results. Errors are propagated to API routes for HTTP status code mapping.

### `/src/components/` — UI Components

Components are organized by feature:

```
components/
├── Admin/                    # Admin panel components
│   ├── AdminNav.tsx          # Admin navigation bar
│   ├── UserManagement.tsx    # User CRUD table
│   ├── CreateUserModal.tsx   # Create user form
│   ├── EditUserModal.tsx     # Edit user form
│   ├── DeleteUserModal.tsx   # Delete user confirmation
│   ├── DeviceManagement.tsx  # Device listing
│   ├── DeleteDeviceModal.tsx # Delete device confirmation
│   ├── PlayerManagement.tsx  # Global player management
│   ├── CreatePlayerModal.tsx # Create player form
│   └── EditPlayerModal.tsx   # Edit player form
├── Leaderboards/
│   ├── Leaderboard.tsx       # Full standings table
│   ├── LeaderboardPlayer.tsx # Individual player row
│   └── LeaderboardSidebar.tsx# Mini standings (current round)
├── Results/
│   ├── Brackets/
│   │   ├── Tournament.tsx    # Bracket tournament view
│   │   ├── Round.tsx         # Single bracket round
│   │   └── Match.tsx         # Individual bracket match
│   └── RoundRobin/
│       ├── Tournament.tsx    # Round-robin view (pool-aware)
│       └── Player.tsx        # Player row in matrix table
├── Button.tsx                # Reusable button component
├── modal.tsx                 # Generic modal wrapper
├── navbar.tsx                # Top navigation bar
├── Login.tsx                 # Login form
├── newTournament.tsx         # Create tournament form
├── selectTournament.tsx      # Tournament list
├── addplayer.tsx             # Add player to tournament
├── newplayer.tsx             # Create new player
├── newmatch.tsx              # Add match form
├── matchediting.tsx          # Edit match form
├── BulkMatchEntry.tsx        # Matrix-based batch entry
├── QRMatchModal.tsx          # QR match generation modal
├── QRMatchCode.tsx           # QR code renderer
├── PoolManagement.tsx        # Pool admin modal
├── Rounds.tsx                # Round navigation
├── Languages.tsx             # Language selector (flags)
└── tournamentNavbarContent.tsx # Tournament-specific nav items
```

---

## Working with the Database

### Connection

The database connection is set up in `src/database/db.ts` using Kysely with the Neon serverless driver. It reads `POSTGRES_URL` from the environment.

### Creating Migrations

```bash
# Create a new migration file
npm run migrate:create add_user_email

# This generates: migrations/007_add_user_email.ts (auto-numbered)
```

Migration file template:

```typescript
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("email", "varchar(255)")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("users")
    .dropColumn("email")
    .execute();
}
```

### Running Migrations

```bash
npm run migrate       # Apply pending migrations
npm run migrate:down  # Roll back last migration
```

### Regenerating Types

After applying migrations, regenerate the TypeScript types:

```bash
npm run db:codegen
```

This updates `src/types/Kysely.ts` with the latest schema types.

> **Note**: During active schema migrations (e.g. the rounds refactor), `src/types/Kysely.ts` is maintained manually until the migration is applied to the live database and codegen can be re-run. In that case, edit it directly and treat it as the source of truth until `npm run db:codegen` is unblocked.

Custom types that need to survive codegen should go in `src/types/MatchTypes.ts`.

### Writing Database Queries

Use Kysely's type-safe query builder:

```typescript
import { db } from "./db";

// Select
const players = await db
  .selectFrom("players")
  .selectAll()
  .execute();

// Insert
const newPlayer = await db
  .insertInto("players")
  .values({ player_name: "John" })
  .returningAll()
  .executeTakeFirstOrThrow();

// Update
await db
  .updateTable("tournament_players")
  .set({ pool_id: poolId })
  .where("player_name", "=", playerName)
  .where("tournament_id", "=", tournamentId)
  .execute();

// Delete
await db
  .deleteFrom("matches")
  .where("id", "=", matchId)
  .execute();
```

---

## Working with API Routes

### Standard API Route Pattern

Every API route follows this structure:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";

export async function POST(req: NextRequest) {
  // 1. Authentication
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Authorization (for admin-only routes)
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 4. Validate input
  if (!body.requiredField) {
    return NextResponse.json({ error: "Missing field" }, { status: 400 });
  }

  // 5. Business logic (database operations)
  try {
    const result = await databaseOperation(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

### Adding a New API Endpoint

1. Create a new file: `src/app/api/<resource>/route.ts`
2. Export handler functions for each HTTP method (`GET`, `POST`, `PUT`, `DELETE`)
3. Include authentication checks using `getSession()`
4. Add database operations in `src/database/`
5. Return proper HTTP status codes

### CORS-Enabled Endpoints

For endpoints accessed by external devices (QR match submit, device registration):

```typescript
function getCorsHeaders() {
  const origin =
    process.env.NODE_ENV === "development"
      ? "*"
      : process.env.CORS_ALLOWED_ORIGIN || "";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: getCorsHeaders() });
}
```

---

## Working with Components

### Component Patterns

**Feature components** (e.g., `UserManagement.tsx`):
- Self-contained with their own data fetching
- Use `useState` for local state
- Call API routes directly via `fetch()`
- Render modals for create/edit/delete operations

**Display components** (e.g., `LeaderboardPlayer.tsx`):
- Receive data via props
- Stateless or minimal local state
- Focus on rendering logic

**Context-connected components** (e.g., `Rounds.tsx`):
- Use `useTournamentContext()` or `useUserContext()`
- Read and update shared state
- Avoid prop drilling

### Creating a New Component

```typescript
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";

interface MyComponentProps {
  someId: number;
}

export default function MyComponent({ someId }: MyComponentProps) {
  const t = useTranslations("MyNamespace");
  const { players } = useTournamentContext();
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4">
      <h2>{t("title")}</h2>
      {/* component content */}
    </div>
  );
}
```

### Button Component

Use the reusable `Button` component with variants:

```typescript
import Button from "@/components/Button";

<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
<Button variant="admin-primary" fullWidth>Admin Action</Button>
```

### Modal Component

```typescript
import Modal from "@/components/modal";

{showModal && (
  <Modal onClose={() => setShowModal(false)}>
    <h2>Modal Title</h2>
    {/* modal content */}
  </Modal>
)}
```

---

## State Management

### TournamentContext

Provides tournament-scoped state:

```typescript
const {
  tournament,      // Current tournament data
  players,         // Players with match history
  setPlayers,      // Update players
  pools,           // Pool data (round-robin)
  setPools,        // Update pools
  loading,         // Data loading state
  activeRound,     // Current round (1-based)
  setActiveRound,  // Change round
  hidden,          // Leaderboard visibility
  setHidden,       // Toggle leaderboard
} = useTournamentContext();
```

**Important**: The context auto-creates "Pool 1" for round-robin tournaments that have no pools. This requires an admin session.

### UserContext

Provides user session state:

```typescript
const { user } = useUserContext();

// user is: { name: string, role: "user" | "admin" } | null
```

### Updating Context After API Calls

When you add/edit/delete data via API, update the context to avoid a full page reload:

```typescript
// After adding a match
const updatedPlayers = players.map(p => {
  if (p.name === matchData.player1) {
    return { ...p, matches: [...p.matches, newMatch] };
  }
  return p;
});
setPlayers(updatedPlayers);
```

---

## Internationalization

### Adding Translation Keys

1. **Always add to Finnish first** (`src/languages/fi.json`) — this is the TypeScript type source
2. Then add to other languages (`en.json`, `se.json`, `ee.json`)

```json
// fi.json (add key here first)
{
  "MyNamespace": {
    "title": "Otsikko",
    "description": "Kuvaus"
  }
}
```

### Using Translations in Components

```typescript
import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations("MyNamespace");

  return <h1>{t("title")}</h1>;
}
```

### Translation File Structure

```
src/languages/
├── fi.json    # Finnish (source of truth for TS types)
├── en.json    # English
├── se.json    # Swedish
└── ee.json    # Estonian
```

### Namespace Conventions

| Namespace           | Used For                          |
|---------------------|-----------------------------------|
| `Metadata`          | Page titles, descriptions         |
| `Login`             | Login form                        |
| `Select`            | Tournament selection page         |
| `Tournament.Buttons`| Tournament action buttons         |
| `NewMatch`          | Match entry form                  |
| `AddPlayer`         | Player addition form              |
| `Leaderboard`       | Standings table                   |
| `Brackets`          | Bracket tournament                |
| `BulkEntry`         | Bulk match entry                  |
| `Pool`              | Pool management                   |
| `Admin.*`           | Admin panel sections              |

---

## Authentication & Authorization

### Session Helper

```typescript
// src/helpers/getsession.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      name: string;
      role: string;
    };
  } catch {
    return null;
  }
}
```

### Protecting Routes

**API routes**: Check session at the top of each handler.

**Pages**: The admin layout (`src/app/[locale]/admin/layout.tsx`) performs a server-side role check and redirects non-admins.

**Components**: Use `useUserContext()` to conditionally render admin-only UI elements.

---

## Testing

### Test Framework

- **Vitest** for test runner and assertions
- **@testing-library/react** for component testing
- **jsdom** environment for DOM simulation

### Running Tests

```bash
npm run test         # Run all tests once
npm run test:watch   # Watch mode for development
```

### Test File Locations

Tests are co-located with source files:

```
src/database/getUsers.test.ts
src/database/getDevices.test.ts
src/database/getPlayers.test.ts
...
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from "vitest";

describe("myFunction", () => {
  it("should do something", () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

Database tests mock the Kysely connection:

```typescript
vi.mock("./db", () => ({
  db: {
    selectFrom: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([mockData]),
  },
}));
```

---

## Adding New Features

### Checklist for New Features

1. **Database**: Create migration if schema changes needed
2. **Types**: Regenerate Kysely types (`npm run db:codegen`) or add custom types
3. **Database layer**: Add functions in `src/database/`
4. **API**: Create route handlers in `src/app/api/`
5. **Components**: Build UI components in `src/components/`
6. **Translations**: Add keys to all 4 language files (Finnish first)
7. **Context**: Update context if new shared state is needed
8. **Tests**: Write tests for database functions and components
9. **Verify**: Run `npm run test` and `npm run lint`

### Example: Adding a New Field to Tournaments

```bash
# 1. Create migration
npm run migrate:create add_tournament_description

# 2. Edit the migration file
# migrations/007_add_tournament_description.ts

# 3. Run migration
npm run migrate

# 4. Regenerate types
npm run db:codegen

# 5. Update database functions in src/database/getTournaments.ts

# 6. Update API route in src/app/api/tournament/name/route.ts

# 7. Update components (newTournament.tsx, etc.)

# 8. Add translations to all language files

# 9. Run tests
npm run test
```

---

## Deployment

### Vercel Deployment

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `POSTGRES_URL` — Neon connection string
   - `JWT_SECRET` — Secret key for JWT signing
   - `CORS_ALLOWED_ORIGIN` — Allowed origin for QR match submissions
3. Deploy — Vercel automatically:
   - Runs `npm run build` (includes tests)
   - Runs `npm run postbuild` (applies migrations)
   - Deploys the Next.js application

### Build Process

```
npm run build
  ├── vitest run          # Tests must pass
  └── next build          # Production build
      └── postbuild
          └── npm run migrate  # Apply migrations
```

---

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Ensure Docker is running: `docker-compose up -d`
- Check that PostgreSQL is on port 5434 (not 5432)
- Verify `POSTGRES_URL` in `.env`

**"Tests failing after schema change"**
- Regenerate types: `npm run db:codegen`
- Update test mocks to match new schema

**"TypeScript error: Property does not exist on translations"**
- Add the missing key to `src/languages/fi.json` first
- Finnish is the source of truth for translation types

**"Migration failed"**
- Check the migration file for syntax errors
- Roll back: `npm run migrate:down`
- Fix and re-run: `npm run migrate`

**"CORS error on QR match submit"**
- In development: should work with `*`
- In production: set `CORS_ALLOWED_ORIGIN` in Vercel to match the requesting domain

**"Docker network error"**
- Create the network: `docker network create hm_network`
- Restart containers: `docker-compose down && docker-compose up -d`
