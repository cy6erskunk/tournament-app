import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("matches").dropColumn("round").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore the column with a default of 1; exact values cannot be recovered
  // without the format column (dropped in 010), so this is best-effort.
  await db.schema
    .alterTable("matches")
    .addColumn("round", "integer", (col) => col.notNull().defaultTo(1))
    .execute();
}
