import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("rounds")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("tournament_id", "integer", (col) =>
      col.references("tournaments.id").onDelete("cascade").notNull(),
    )
    .addColumn("round_order", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("type", "varchar(32)", (col) => col.notNull())
    .addUniqueConstraint("rounds_tournament_id_round_order_key", [
      "tournament_id",
      "round_order",
    ])
    .addCheckConstraint(
      "rounds_type_check",
      sql`type IN ('pools', 'elimination')`,
    )
    .execute();

  // Backfill: Round Robin tournaments always have exactly 2 pool rounds
  await sql`
    INSERT INTO rounds (tournament_id, round_order, type)
    SELECT t.id, gs.n, 'pools'
    FROM tournaments t
    CROSS JOIN generate_series(1, 2) AS gs(n)
    WHERE t.format = 'Round Robin'
  `.execute(db);

  // Backfill: Bracket tournaments get a single elimination round
  await sql`
    INSERT INTO rounds (tournament_id, round_order, type)
    SELECT id, 1, 'elimination'
    FROM tournaments
    WHERE format = 'Brackets'
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("rounds").execute();
}
