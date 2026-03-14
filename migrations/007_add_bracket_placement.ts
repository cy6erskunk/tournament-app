import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add placement_size to tournaments
  // null = standard single elimination
  // powers of 2 (4, 8, 16, 32) = full placement bracket up to that many spots
  await db.schema
    .alterTable("tournaments")
    .addColumn("placement_size", "integer", (col) => col)
    .execute();

  // Add bracket_section to matches
  // null = main bracket (backwards compatible)
  // "c3-4", "c5-8", "c9-16", etc. = consolation bracket for those places
  await db.schema
    .alterTable("matches")
    .addColumn("bracket_section", "varchar(32)", (col) => col)
    .execute();

  // Drop the old unique constraint (only covered round + tournament_id without bracket_section)
  await sql`DROP INDEX IF EXISTS matches_player1_player2_round`.execute(db);

  // Recreate unique constraint including bracket_section so the same players can meet
  // in both the main bracket and a consolation bracket
  await sql`
    CREATE UNIQUE INDEX matches_player1_player2_round_section
    ON matches (
      LEAST(player1, player2),
      GREATEST(player1, player2),
      round,
      tournament_id,
      COALESCE(bracket_section, '')
    )
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS matches_player1_player2_round_section`.execute(db);

  await sql`
    CREATE UNIQUE INDEX matches_player1_player2_round
    ON matches (
      LEAST(player1, player2),
      GREATEST(player1, player2),
      round,
      tournament_id
    )
  `.execute(db);

  await db.schema
    .alterTable("matches")
    .dropColumn("bracket_section")
    .execute();

  await db.schema
    .alterTable("tournaments")
    .dropColumn("placement_size")
    .execute();
}
