import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add round_id FK to matches (nullable — backfilled below)
  await db.schema
    .alterTable("matches")
    .addColumn("round_id", "integer", (col) =>
      col.references("rounds.id").onDelete("set null"),
    )
    .execute();

  // Backfill pool rounds: match by tournament_id AND round_order = matches.round
  await sql`
    UPDATE matches m
    SET round_id = r.id
    FROM rounds r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.tournament_id = m.tournament_id
      AND r.type = 'pools'
      AND r.round_order = m.round
      AND t.format = 'Round Robin'
  `.execute(db);

  // Backfill elimination rounds: link all bracket matches to the single elimination round
  await sql`
    UPDATE matches m
    SET round_id = r.id
    FROM rounds r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.tournament_id = m.tournament_id
      AND r.type = 'elimination'
      AND t.format = 'Brackets'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("matches").dropColumn("round_id").execute();
}
