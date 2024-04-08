import { DB } from "@/types/Kysely";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { createKysely } from "@vercel/postgres-kysely";

// Gets a Kysely connection based on application environment
function getConnection() {
  const env = process.env.NODE_ENV;

  if (env === "production") {
    return createKysely<DB>();
  }

  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable not defined")
  }

  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 10
    })
  });

  return new Kysely<DB>({ dialect });
}

export const db = getConnection();
export { sql } from "kysely";
