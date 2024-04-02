import { DB } from "../types/Kysely";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { createKysely } from "@vercel/postgres-kysely";

const dialect = new PostgresDialect({
  pool: new Pool({
    database: process.env.POSTGRES_DB || "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRESS_PASSWORD || "postgres",
    port: Number(process.env.POSTGRES_PORT) || 5434,
    max: 10,
  }),
});

// Gets a Kysely connection based on application environment
function getConnection() {
  const env = process.env.NODE_ENV;

  if (env === "production") {
    return createKysely<DB>();
  }

  return new Kysely<DB>({ dialect });
}

export const db = getConnection();
export { sql } from "kysely";
