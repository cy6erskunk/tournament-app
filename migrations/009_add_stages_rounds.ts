import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add rounds column to stages — meaningful for 'pools' stages,
  // represents how many full rounds of pool matches are played (e.g. 1 or 2).
  // Ignored for 'elimination' stages.
  await db.schema
    .alterTable("stages")
    .addColumn("rounds", "integer", (col) => col.notNull().defaultTo(1))
    .execute();

  // Backfill from actual match data: derive the max round number for each stage.
  // Falls back to 1 if no matches exist yet for that stage.
  await sql`
    UPDATE stages s
    SET rounds = COALESCE(
      (
        SELECT MAX(m.round)
        FROM matches m
        WHERE m.stage_id = s.id
      ),
      1
    )
    WHERE s.type = 'pools'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("stages").dropColumn("rounds").execute();
}
