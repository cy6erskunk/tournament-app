import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Create stages table to represent ordered phases within a tournament
  await db.schema
    .createTable("stages")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("tournament_id", "integer", (col) =>
      col.references("tournaments.id").onDelete("cascade").notNull(),
    )
    .addColumn("stage_order", "integer", (col) => col.notNull().defaultTo(1))
    .addColumn("type", "varchar(32)", (col) => col.notNull())
    .addColumn("name", "varchar(128)", (col) => col.notNull().defaultTo(""))
    .execute();

  // Backfill one stage per existing tournament, derived from the format column
  await sql`
    INSERT INTO stages (tournament_id, stage_order, type, name)
    SELECT
      id,
      1,
      CASE WHEN format = 'Round Robin' THEN 'pools' ELSE 'elimination' END,
      ''
    FROM tournaments
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("stages").execute();
}
