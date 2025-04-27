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

For local development you will want to create a file named `.env.development.local`.
The `POSTGRES_URL` is important for connecting to the database. You can have the `JWT_SECRET` as anything, this will "sign" all user cookies with this secret, possibly causing issues if you change it later while logged in.

```env
POSTGRES_URL="postgres://postgres:postgres@localhost:5434/postgres"
JWT_SECRET="secret"
```

For running `npm run prod` you will have to use the production `POSTGRES_URL` and `JWT_SECRET` from Vercel and put them in a `.env.production.local` file.

```env
POSTGRES_URL="PRODUCTION_POSTGRES_URL_HERE"
JWT_SECRET="PRODUCTION_JWT_SECRET_HERE"
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

## Internationalization (i18n) Translations

The project supports internationalization for translations. Translation files are stored in the `languages` directory. You can add translations for different languages and use the next-i18next library to handle localization.

To switch languages, update the language in the URL (e.g., `/en` or `/fi`). To use this in conjunction with the App Router, we use the [locale] folder name. For detailed configuration and usage of i18n in Next.js, refer to the [Next.js Internationalization documentation](https://nextjs.org/docs/app/building-your-application/routing/internationalization) and [next-intl official documentation](https://next-intl-docs.vercel.app/docs/getting-started).

## Deployment & CI/CD

The project is currently set up for deployment on Vercel. Connect your Vercel account to the repository or a fork of it and configure the deployment settings.

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
