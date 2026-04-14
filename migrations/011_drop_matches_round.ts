import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Drop any existing unique index that keyed on matches.round
  await sql`
    DROP INDEX IF EXISTS matches_unique_players_tournament_round_idx
  `.execute(db);

  await db.schema.alterTable("matches").dropColumn("round").execute();

  // Add replacement uniqueness on round_id (COALESCE with -1 handles NULL round_id)
  await sql`
    CREATE UNIQUE INDEX matches_unique_players_tournament_round_id_idx
    ON matches (LEAST(player1, player2), GREATEST(player1, player2), COALESCE(round_id, -1), tournament_id)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    DROP INDEX IF EXISTS matches_unique_players_tournament_round_id_idx
  `.execute(db);

  // Restore the column with a default of 1, then backfill from rounds.round_order
  // via matches.round_id where possible (falls back to 1 when round_id is NULL
  // or the referenced round row is missing).
  await db.schema
    .alterTable("matches")
    .addColumn("round", "integer", (col) => col.notNull().defaultTo(1))
    .execute();

  await sql`
    UPDATE matches
    SET round = COALESCE(
      (SELECT rounds.round_order FROM rounds WHERE rounds.id = matches.round_id),
      1
    )
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX matches_unique_players_tournament_round_idx
    ON matches (LEAST(player1, player2), GREATEST(player1, player2), round, tournament_id)
  `.execute(db);
}
