# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tournament App is a full-stack Next.js application for managing tournaments, events, and users for the Helsingin Miekkailijat (Helsinki Fencers) organization. It uses PostgreSQL (Neon) with Kysely ORM, React 19, TypeScript, and supports 4 languages (Finnish, English, Swedish, Estonian).

## ⚠️ CRITICAL: Testing Policy

**ALWAYS run `npm run test` before committing any code changes.**

- Tests MUST pass before any commit
- Run `npm install` first if dependencies are not installed
- If tests fail, fix them before committing
- Update test expectations when changing functionality (e.g., cookie settings, API responses)
- All 231 tests should pass

**Workflow:**

1. Make code changes
2. Run `npm run test`
3. If tests fail, fix code or update tests
4. Only commit when all tests pass

## Common Commands

### Development & Testing

```bash
npm run dev          # Start development server
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint (Next.js 16+: uses 'eslint' directly, not 'next lint')
npm run lint:fix     # Run ESLint with auto-fix
npm run build        # Run tests + build for production
npm run prod         # Run tests + build + start production server
npm run start        # Start production server
```

### Database Setup (Docker)

```bash
docker-compose up -d  # Start PostgreSQL (port 5434) and Adminer (port 5433)
```

### Database Migrations

```bash
npm run migrate:create <name>  # Create new migration file (auto-numbered)
npm run migrate                # Run all pending migrations (local with .env file)
npm run migrate:down           # Roll back the last applied migration
npm run postbuild              # Run migrations (used by Vercel after build)
npm run db:codegen             # Regenerate TypeScript types from schema
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 16 with App Router, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with PostgreSQL (Neon) + Kysely ORM
- **Database**: PostgreSQL (Neon) with Kysely ORM and TypeScript-based migrations
- **Runtime**: Node.js 24+ (migrations use tsx for TypeScript execution)
- **QR Code Generation**: qrcode library for match management integration
- **Internationalization**: next-intl with URL-based routing (`/[locale]/...`)
- **Authentication**: JWT tokens with bcrypt password hashing

### Key Directory Structure

- `/src/app/[locale]/`: Internationalized pages (en, fi, se, ee)
- `/src/app/[locale]/admin/`: Admin panel pages (users, devices, qr-audit)
- `/src/app/api/`: REST API endpoints for players, tournaments, matches, QR match integration
- `/src/app/api/admin/`: Admin API endpoints for user and device management
- `/src/components/`: React components organized by feature (Leaderboards, Results, Tournaments)
- `/src/components/Admin/`: Admin-specific components (UserManagement, DeviceManagement, Modals)
- `/src/database/`: Database operation layer with individual service files
- `/src/context/`: React Context for global state (TournamentContext, UserContext)
- `/src/types/`: TypeScript definitions including auto-generated Kysely types and custom helper types
- `/src/languages/`: Translation files for 4 supported languages
- `/migrations/`: Database migration files (TypeScript, auto-numbered)
- `/scripts/`: Utility scripts including migration file generator

### Database Schema

Core tables: `users`, `tournaments`, `players`, `tournament_players`, `matches`, `submitter_devices`, `pools`

- Supports both bracket and round-robin tournament formats
- Detailed match tracking with hit counts
- Role-based access control (admin/user)
- Device token management for authorized QR code submissions
- Pool (group) support for round-robin tournaments: players optionally assigned to a `pools` row via `tournament_players.pool_id`

## Development Patterns

### State Management

- React Context pattern with custom hooks for type safety
- Global tournament and user state managed through context providers
- Database operations abstracted into individual service files

### Internationalization

- All routes prefixed with locale: `/[locale]/page`
- Middleware handles language switching and routing
- Finnish as default locale, comprehensive translation coverage
- **IMPORTANT**: Finnish locale (`fi.json`) is the source of truth for TypeScript types
  - TypeScript types for `useTranslations()` are generated from `/src/languages/fi.json` via `global.d.ts`
  - When adding new translation keys to any language file, ALWAYS add them to `fi.json` first
  - Missing keys in `fi.json` will cause TypeScript errors even if they exist in other language files
  - Example: `t("somekey")` requires `"somekey"` to exist in `fi.json` for TypeScript to accept it

### Database Operations

- Kysely ORM provides type-safe SQL queries
- Auto-generated types from database schema in `/src/types/Kysely.ts` (regenerated by `npm run db:codegen`)
- Custom helper types in `/src/types/MatchTypes.ts` (safe from codegen, won't be overwritten)
- Environment-specific connection handling for development/production

### Database Migrations

- **Migration System**: Kysely's built-in `Migrator` with TypeScript migrations
- **Runtime**: Uses `tsx` for TypeScript execution with path alias support
- **Migration Files**: Stored in `/migrations/` directory, auto-numbered (001*, 002*, etc.)
- **Workflow**:
  1. Create migration: `npm run migrate:create add_new_column`
  2. Edit generated file in `/migrations/` to implement `up()` and `down()` functions
  3. Run migrations: `npm run migrate`
  4. Update types: `npm run db:codegen`
- **Scripts**:
  - `scripts/create-migration.ts` - Auto-generates numbered migration files
  - `src/database/migrator.ts` - Executes pending migrations
- **Best Practices**:
  - Always implement both `up()` and `down()` for reversibility
  - One schema change per migration file
  - Test on development data before production
  - Regenerate types after applying migrations

### Component Organization

- Feature-based component structure
- Separation between display components and business logic
- Context hooks provide clean data access patterns

## Environment Setup

### Required Environment Variables

- Database connection settings for PostgreSQL
- JWT secrets for authentication
- Next.js configuration variables

### Docker Development

- PostgreSQL runs on port 5434 (not default 5432)
- Adminer database management on port 5433
- Requires `hm_network` Docker network

## Testing

- Vitest with jsdom environment
- @testing-library/react for component testing
- Tests must pass before production builds
- Current coverage is limited - expand testing for new features

## Multi-Pool Round-Robin Tournaments

Round-robin tournaments support multiple pools (groups) of fencers. All players share a single ranking regardless of which pool they belong to.

### Key Concepts

- **Pools**: Named groups within a tournament (e.g. Pool A, Pool B). Pool names are optional — if omitted, the API auto-generates "Pool N" based on existing pool count.
- **Player assignment**: Each player in `tournament_players` has an optional `pool_id` FK. Players without a pool appear in an "Unassigned" section.
- **Shared ranking**: `LeaderboardBuilder` ranks all players together across pools — no changes needed to ranking logic.
- **Pool-scoped match matrix**: Each pool's table shows only intra-pool opponent columns (via `poolPlayers` prop on `Player` component).

### Files

- `migrations/004_add_pools.ts` — adds `pools` table and `pool_id` column on `tournament_players`
- `src/database/getPools.ts` — `getPools`, `createPool`, `deletePool`, `assignPlayerToPool`
- `src/app/api/tournament/[tournamentId]/pools/route.ts` — GET/POST/DELETE pools
- `src/app/api/tournament/[tournamentId]/pools/[poolId]/players/route.ts` — POST assign player; `poolId=0` unassigns
- `src/components/PoolManagement.tsx` — admin modal for creating/deleting pools and assigning players
- `src/components/Results/RoundRobin/Tournament.tsx` — groups players by pool and renders per-pool tables
- `src/context/TournamentContext.tsx` — fetches and exposes `pools` / `setPools` state

### Backward Compatibility

When no pools exist (`context.pools.length === 0`), the original single-table round-robin view renders unchanged.

## QR Code Match Integration

### Overview

The application supports QR code generation for match management, allowing third-party apps to scan codes and submit match results externally.

### Key Components

- **QRMatchCode**: React component for generating and displaying QR codes
- **QRMatchModal**: Modal interface for creating QR matches
- **API Endpoints**: `/api/qr-match/generate` (create), `/api/qr-match/submit` (results)
- **Data Flow**: Generate match ID → Store match metadata → Third-party submission → Update match results

### QR Code Data Structure

```typescript
interface QRMatchData {
  matchId: string; // Unique identifier
  player1: string; // First player name
  player2: string; // Second player name
  tournamentId: number; // Tournament reference
  round: number; // Current round
  submitUrl: string; // API endpoint for results
}
```

### CORS Configuration

The QR match submission endpoint supports cross-origin requests with environment-based configuration:

- **Development**: Allows all domains (`*`) for testing
- **Production**: Uses `CORS_ALLOWED_ORIGIN` environment variable (single domain only)
- **Implementation**: `src/app/api/qr-match/submit/route.ts` includes `getCorsHeaders()` function and OPTIONS handler
- **Headers**: Supports POST/OPTIONS methods with Content-Type and Authorization headers
- **Limitations**: Only single origin supported; wildcard patterns not supported due to CORS spec

### Usage

1. Click "Generate QR Match" button in tournament interface
2. Select two players for the match
3. QR code generated with match metadata
4. Third-party app scans code and submits results to API
5. Match results automatically update in tournament system

## Admin Panel

### Overview

The admin panel provides centralized management for users, devices, and audit logs. Access is restricted to users with the `admin` role.

### Admin Sections

#### User Management (`/admin/users`)

- **Full CRUD Operations**: Create, read, update, and delete user accounts
- **Role Management**: Toggle between user and admin roles
- **Password Management**: Change passwords for existing users
- **Protection**: Prevents deletion of the last admin user
- **Components**: UserManagement, CreateUserModal, EditUserModal, DeleteUserModal
- **API Endpoints**: `/api/admin/users` (GET, POST), `/api/admin/users/[username]` (GET, PATCH, DELETE)
- **Database Functions**: `getAllUsers()`, `getUser()`, `createUser()`, `updateUserRole()`, `updateUserPassword()`, `deleteUser()`

#### Device Management (`/admin/devices`)

- **View Only**: Admin panel is for monitoring registered devices, not creating them
- **Self-Registration**: Devices register automatically via `/api/submitter/register` when first used
- **Device Listing**: View all registered devices with creation and last usage timestamps
- **Device Deletion**: Remove unauthorized or compromised device tokens
- **Usage Tracking**: Monitor when devices were last used
- **Components**: DeviceManagement, DeleteDeviceModal
- **API Endpoints**: `/api/admin/devices` (GET only), `/api/admin/devices/[deviceToken]` (GET, DELETE)
- **Database Functions**: `getAllDevices()`, `getDevice()`, `deleteDevice()`, `registerDevice()` (used by external API)
- **Database Table**: `submitter_devices` with columns: `device_token` (PK), `submitter_name`, `created_at`, `last_used`
- **Registration Flow**: Third-party apps call `/api/submitter/register` with device name → receive auto-generated token → use token for QR match submissions

#### QR Audit (`/admin/qr-audit`)

- **Status**: Placeholder for future implementation
- **Planned Features**: View QR code submission history, filter by tournament/date/submitter, identify suspicious submissions

### Admin Architecture

- **Authentication**: Layout-level role check redirects non-admin users
- **API Security**: All admin endpoints verify admin role before processing
- **UI Patterns**: Reusable Modal component, tab-based editing, loading states, error handling
- **Translations**: Full multi-language support via `Admin.*` namespace

### Testing

- Database service functions have comprehensive unit tests (getUsers, createUser, deleteUser, getDevices, createDevice, deleteDevice)
- Tests use Vitest with mocked database connections
- Located in `/src/database/*.test.ts` files

## Build Process

- Tests run automatically before builds (`npm run build`)
- TypeScript compilation with strict mode
- Tailwind CSS processing with autoprefixer
- Production builds include internationalization optimization
- **Migrations run automatically after build** via `postbuild` script (Vercel deployment)

### Vercel Deployment

- Environment variables (`POSTGRES_URL`, `JWT_SECRET`, `CORS_ALLOWED_ORIGIN`) must be set in Vercel dashboard
- Migrations run automatically after successful build via `postbuild` hook
- No `.env` file needed - uses Vercel environment variables
