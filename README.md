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
The `POSTGRES_URL` is important for connecting to the database. You can have the `JWT_SECRET` as anything, this will "sign" all user cookies with this secret, possibly causing issues if you change it later while logged in.

```env
POSTGRES_URL="postgres://postgres:postgres@localhost:5434/postgres"
JWT_SECRET="secret"
```

For running `npm run prod` you will have to use the production `POSTGRES_URL` and `JWT_SECRET` from Vercel and put them in a `.env.production.local` file.

```env
POSTGRES_URL="PRODUCTION_POSTGRES_URL_HERE"
JWT_SECRET="PRODUCTION_JWT_SECRET_HERE"
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

Next.js uses a file-system-based router, where each .js or .tsx file in the pages directory automatically becomes a route. You can navigate the project using the app router.

For example, the file pages/index.js corresponds to the home route (/). To create a new route, add a new file in the pages directory.

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

- `POST /api/qr-match/generate` - Generate QR code data for a match (requires authentication)
- `POST /api/qr-match/submit` - Submit match results via QR code (supports CORS)
- `OPTIONS /api/qr-match/submit` - CORS preflight support

### Debug Logging

In non-production environments (development and preview), the QR code generation endpoint logs the full QR match payload to the server console. This helps with debugging and understanding the data structure being encoded in QR codes.

**When it logs:**
- Local development (`npm run dev` - `VERCEL_ENV` is undefined)
- Vercel preview deployments (`VERCEL_ENV === "preview"`)

**Example log output:**
```
[QR Debug] Generated QR match payload: {
  "matchId": "abc123...",
  "player1": "John Doe",
  "player2": "Jane Smith",
  "tournamentId": 42,
  "round": 1,
  "baseUri": "http://localhost:3000",
  "submitUrl": "http://localhost:3000/api/qr-match/submit"
}
```

**Note:** This debug logging is automatically disabled in production to avoid cluttering logs with sensitive match data.

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
- `JWT_SECRET` - Production JWT signing secret (use a strong random value)
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
