# Tournament App

Next.js project that serves as an internal full-stack web application (CRUD). Managing events, tournaments and users.

### Tech stack
- React for the frontend
- Vercel for hosting
- PostgreSQL as the database.
- Docker to help with local development.

## Prerequisites

Make sure you have the following prerequisites installed on your machine before setting up the project locally.

- Node.js: Download and install Node.js from [https://nodejs.org/](https://nodejs.org/).
- Package Manager: Choose one of the following package managers: npm, yarn, pnpm, or bun.
- Docker: Install Docker from [https://www.docker.com/get-started](https://www.docker.com/get-started).

## Getting Started

### Setup

To set up the project locally, follow these steps.

```bash
# Clone the repository:
git clone <repository-url>

# Navigate to the project directory:
cd helsingin-miekkailijat

# Install dependencies:
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

For local development you will want to create a file named `.env`.

**IMPORTANT:** The `JWT_SECRET` must be a strong, cryptographically secure random string (minimum 32 characters). The application will **refuse to start** with weak secrets like "secret", "password", etc.

To generate a strong JWT secret, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example `.env` file for local development:
```env
POSTGRES_URL="postgres://postgres:postgres@localhost:5434/postgres"
JWT_SECRET="<paste-your-generated-secret-here>"
```

**Note:** Changing the `JWT_SECRET` will invalidate all existing user sessions/cookies.

For running `npm run prod` you will have to use the production `POSTGRES_URL` and `JWT_SECRET` from Vercel and put them in a `.env.production.local` file.

Generate a strong production secret using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example `.env.production.local`:
```env
POSTGRES_URL="PRODUCTION_POSTGRES_URL_HERE"
JWT_SECRET="<paste-your-generated-production-secret-here>"
CORS_ALLOWED_ORIGIN="https://your-external-app.com"
```

### Run the development server

```bash
docker compose up --build
```

Open http://localhost:3000 with your browser to see the result.

### Admin/Testing credentials

To add admin credentials in a debug environment you can use this SQL command to add an admin `admin`, `password` and a user account `user`, `password`.

```sql
INSERT INTO "users" ("username", "password", "role")
VALUES
    ('admin', '$2b$10$pYjCPeAy8xbSHrI6nevNgOaG1nLadHmlJeDtuHvbk/oWci9EQcqD.', 'admin'),
    ('user', '$2b$10$pYjCPeAy8xbSHrI6nevNgOaG1nLadHmlJeDtuHvbk/oWci9EQcqD.', 'user')
```

## App Router

> [!IMPORTANT]
> [Read more about the Next.js App Router from here](https://nextjs.org/docs/app/building-your-application/routing#the-app-router). ([Frequently Asked Questions](https://nextjs.org/docs/app))

Next.js 16 uses a file-system-based router with the App Router, where each page.tsx file in the app directory automatically becomes a route. The project uses internationalized routing with `/[locale]/` prefixes.

Routes are defined using the app directory structure, not the legacy pages directory.

## Database Migrations

The project uses Kysely's built-in migration system with TypeScript migration files.

### Creating Migrations

Create a new migration file with automatic numbering:

```bash
npm run migrate:create add_new_column
```

This creates a numbered file like `migrations/001_add_new_column.ts` with a template:

```typescript
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // TODO: Implement migration
  // Example: Add a new column
  await db.schema
    .alterTable('matches')
    .addColumn('notes', 'text')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // TODO: Implement rollback
  // Example: Remove the column
  await db.schema
    .alterTable('matches')
    .dropColumn('notes')
    .execute()
}
```

### Running Migrations

Apply all pending migrations:

```bash
npm run migrate
```

This runs automatically on Vercel deployments via the `postbuild` hook.

### Rolling Back Migrations

Roll back the last applied migration:

```bash
npm run migrate:down
```

This executes the `down()` function of the most recently applied migration, reverting its changes. Use this carefully, especially in production.

### Regenerating TypeScript Types

After running migrations, regenerate Kysely types:

```bash
npm run db:codegen
```

This updates `src/types/Kysely.ts` with the new database schema. Custom helper types in `src/types/MatchTypes.ts` will remain safe.

### Migration Best Practices

- **Always implement both `up()` and `down()`** for reversibility
- **One schema change per migration** - easier to debug and rollback
- **Test migrations locally first** before deploying to production
- **Never edit applied migrations** - create new ones instead
- **Descriptive names** - Use clear names like `add_user_email_column`
- **Backup production data** before running migrations

## QR Code Match Integration

The application supports QR code generation for external match result submission. Third-party applications can scan QR codes and submit match results through the API.

### Audit Trail System

The QR match system includes an optional audit trail feature for accountability in tournament submissions:

- **Device Registration**: Users can register their device once with their name to receive a persistent token
- **Tournament Setting**: Admins can enable/disable identity requirement per tournament via `require_submitter_identity` flag
- **Match Tracking**: When enabled, all match submissions record who submitted the result and when
- **Flexible**: Can be disabled for casual tournaments where accountability is not needed

### CORS Configuration

The QR match submission endpoint (`/api/qr-match/submit`) is configured with CORS headers to allow cross-origin requests:

- **Development**: Allows requests from all domains (`*`) for easy testing
- **Production**: Restricts access to the domain specified in the `CORS_ALLOWED_ORIGIN` environment variable

### Environment Variables

For production deployment, configure the allowed origins:

```env
CORS_ALLOWED_ORIGIN="https://your-qr-app.com"
```

**Important CORS Limitations:**
- Only a single origin can be specified due to CORS header limitations
- Wildcard subdomain patterns (e.g., `*.vercel.app`) are not supported
- If your server needs to support multiple origins, implement dynamic origin validation that returns the specific client's origin in the header
- If not set in production, CORS will be restrictive (empty string)

### API Endpoints

**Match Management:**
- `POST /api/qr-match/generate` - Generate QR code data for a match (requires authentication)
- `POST /api/qr-match/submit` - Submit match results via QR code (supports CORS, optional device token)
- `OPTIONS /api/qr-match/submit` - CORS preflight support

**Device Registration (Audit Trail):**
- `POST /api/submitter/register` - Register a device for submitter identification
- `OPTIONS /api/submitter/register` - CORS preflight support

### Third-Party App Integration

#### 1. Device Registration (One-Time, Optional)

Users should register their device once to enable identity tracking:

```javascript
// POST /api/submitter/register
const response = await fetch('https://your-app.com/api/submitter/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: "John Doe" })
});

const { deviceToken } = await response.json();
// Store deviceToken in localStorage for future submissions
localStorage.setItem('deviceToken', deviceToken);
```

#### 2. Scanning QR Code

The QR code contains JSON data with match information and requirements:

```javascript
const qrData = JSON.parse(scanQRCode());
// {
//   matchId: "a1b2c3d4...",
//   requireSubmitterIdentity: true,  // Tournament setting
//   player1: "Player 1",
//   player2: "Player 2",
//   tournamentId: 123,
//   round: 2,
//   submitUrl: "https://your-app.com/api/qr-match/submit"
// }
```

#### 3. Submitting Match Results

Include the device token if the tournament requires it or if available:

```javascript
// POST to submitUrl from QR code
const deviceToken = localStorage.getItem('deviceToken');

await fetch(qrData.submitUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matchId: qrData.matchId,
    deviceToken: deviceToken,  // Optional, required if tournament requires it
    player1_hits: 5,
    player2_hits: 3,
    winner: "Player 1"
  })
});
```

**Response Codes:**
- `200` - Match submitted successfully
- `400` - Invalid match data
- `401` - Missing device token when required, or invalid device token
- `404` - Match ID not found or expired (>1 hour old)

### Database Schema (Audit Trail)

The audit trail system adds the following tables and columns:

**New Table: `submitter_devices`**
- `device_token` (PK) - Unique device identifier
- `submitter_name` - Person's name
- `created_at` - Registration timestamp
- `last_used` - Last submission timestamp

**Updated Tables:**
- `tournaments.require_submitter_identity` - Boolean flag (default: false)
- `matches.submitted_by_token` - Reference to submitter device (nullable)
- `matches.submitted_at` - Submission timestamp (nullable)

### Security Model

The QR match system uses a simple, accountability-based security model appropriate for small club tournaments:

- **Random Match IDs**: 128-bit random identifiers prevent trivial enumeration
- **Expiration**: QR match data expires after 1 hour
- **Device Tokens**: Optional identity tracking for audit purposes
- **Trust-Based**: Designed for environments with known, trusted participants

This model prioritizes simplicity and accountability over cryptographic security, making it ideal for club-level tournaments where participants know each other.

## Internationalization (i18n) Translations

The project supports internationalization for translations. Translation files are stored in the `src/languages` directory. You can add translations for different languages and use the next-intl library to handle localization.

To switch languages, update the language in the URL (e.g., `/en` or `/fi`). To use this in conjunction with the App Router, we use the [locale] folder name. For detailed configuration and usage of i18n in Next.js, refer to the [Next.js Internationalization documentation](https://nextjs.org/docs/app/building-your-application/routing/internationalization) and [next-intl official documentation](https://next-intl-docs.vercel.app/docs/getting-started).

### TypeScript Types for Translations

**Important:** The Finnish locale (`fi.json`) is used as the source of truth for TypeScript type definitions. This is configured in `global.d.ts`:

```typescript
type Messages = typeof import("@/languages/fi.json");
declare interface IntlMessages extends Messages {}
```

This means:
- All translation keys must exist in `src/languages/fi.json` for TypeScript to recognize them
- If you add a new translation key to any language file (en.json, se.json, ee.json), you must also add it to `fi.json` or you'll get TypeScript errors
- TypeScript will provide autocomplete and type checking for `useTranslations()` based on the Finnish translation file structure

**Example:** If you add a key like `"newkey": "New value"` to `en.json`, you must also add the corresponding Finnish translation to `fi.json`, or TypeScript will not recognize it as a valid translation key.

## Deployment & CI/CD

The project is currently set up for deployment on Vercel. Connect your Vercel account to the repository or a fork of it and configure the deployment settings.

### Environment Variables on Vercel

Set the following environment variables in your Vercel project dashboard:

- `POSTGRES_URL` - Production database connection string
- `JWT_SECRET` - Production JWT signing secret (**MUST be a strong random value, minimum 32 characters**). Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `CORS_ALLOWED_ORIGIN` - Allowed origin for QR match submissions (e.g., `https://your-app.com`)

### Database Migrations

Migrations run automatically after each deployment via the `postbuild` script. The deployment process:

1. Tests run (`vitest run`)
2. Build completes (`next build`)
3. Migrations apply (`postbuild` hook runs `tsx src/database/migrator.ts`)
4. App starts

Migrations use environment variables from Vercel dashboard - no `.env` file needed in production.

## Troubleshooting

### sh: next: not found

If you get this error during your Docker build, make sure you installed the dependencies before running `docker compose`.

### Failed to load SWC binary for linux/x64, see more info here: https://nextjs.org/docs/messages/failed-loading-swc

Removing your node_modules folder and reinstalling fixes this. [Other Possible Ways to Fix It
](https://nextjs.org/docs/messages/failed-loading-swc#possible-ways-to-fix-it)

## Credits

Originally forked from https://github.com/Miconen/tournament-app, project co-authored by:
- [Mico Rintala](https://github.com/Miconen)
- [Niko Söder](https://github.com/NikoSoder)
- [Anton Kiiski](https://github.com/Kiiskii)
- [Kasper Keske](https://github.com/Kaztu)
