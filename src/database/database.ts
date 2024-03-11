import { DB } from "./types";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

const dialect = new PostgresDialect({
  pool: new Pool({
    // Give me node env variable here
    database: process.env.DB_NAME ?? "postgres",
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    port: parseInt(process.env.DB_PORT ?? "5434"),
    max: parseInt(process.env.DB_MAX_CONNECTIONS ?? "10"),
  }),
});

export const db = new Kysely<DB>({ dialect });
