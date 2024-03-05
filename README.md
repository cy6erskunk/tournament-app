# Helsingin Miekkailijat

Next.js project that serves as an internal full-stack web application (CRUD) for Helsingin Miekkailijat. Managing events, tournaments and users.

> [!NOTE]
> For the sake of consistency and collaboration, English is chosen as the primary language for documentation, comments, and codebase discussions.

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

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000 with your browser to see the result.

## App Router

> [!IMPORTANT]  
> [Read more about the Next.js App Router from here](https://nextjs.org/docs/app/building-your-application/routing#the-app-router). ([Frequently Asked Questions](https://nextjs.org/docs/app))

Next.js uses a file-system-based router, where each .js or .tsx file in the pages directory automatically becomes a route. You can navigate the project using the app router.

For example, the file pages/index.js corresponds to the home route (/). To create a new route, add a new file in the pages directory.

## Internationalization (i18n) Translations

The project supports internationalization for translations. Translation files are stored in the `languages` directory. You can add translations for different languages and use the next-i18next library to handle localization.

To switch languages, update the language in the URL (e.g., `/en` or `/fi`). To use this in conjunction with the App Router, we use the [locale] folder name. For detailed configuration and usage of i18n in Next.js, refer to the [Next.js Internationalization (i18n) documentation](https://nextjs.org/docs/advanced-features/i18n)

## Database

This project uses PostgreSQL as the database.

### Docker setup

To run the project using Docker, run this

```bash
docker compose up --build
```

## Deployment & CI/CD

The project is currently set up for deployment on Vercel. Connect your Vercel account to the repository or a fork of it and configure the deployment settings.
