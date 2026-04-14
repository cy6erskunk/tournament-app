import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Final safety backfill: any matches that still have null round_id get linked
  // via tournament format (in case edge-case data slipped through migration 008).
  await sql`
    UPDATE matches m
    SET round_id = r.id
    FROM rounds r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.tournament_id = m.tournament_id
      AND m.round_id IS NULL
      AND r.type = 'pools'
      AND r.round_order = m.round
      AND t.format = 'Round Robin'
  `.execute(db);

  await sql`
    UPDATE matches m
    SET round_id = r.id
    FROM rounds r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.tournament_id = m.tournament_id
      AND m.round_id IS NULL
      AND r.type = 'elimination'
      AND r.round_order = 1
      AND t.format = 'Brackets'
  `.execute(db);

  await db.schema.alterTable("tournaments").dropColumn("format").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("tournaments")
    .addColumn("format", "text", (col) => col.notNull().defaultTo("Round Robin"))
    .execute();

  // Re-derive format from rounds
  await sql`
    UPDATE tournaments t
    SET format = CASE
      WHEN EXISTS (
        SELECT 1 FROM rounds r WHERE r.tournament_id = t.id AND r.type = 'elimination'
      ) THEN 'Brackets'
      ELSE 'Round Robin'
    END
  `.execute(db);
}
