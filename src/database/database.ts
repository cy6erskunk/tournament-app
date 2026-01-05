import { DB } from "@/types/Kysely";
import { Pool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Kysely, PostgresDialect } from "kysely";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// Gets a Kysely connection based on application environment
function getConnection() {
  const env = process.env.NODE_ENV;

  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable not defined");
  }

  if (env === "production") {
    return new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: new NeonPool({ connectionString: process.env.POSTGRES_URL }),
      }),
    });
  }

  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 10,
    }),
  });

  return new Kysely<DB>({ dialect });
}

export const db = getConnection();
export { sql } from "kysely";
