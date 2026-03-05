import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Create pools table for grouping players in round-robin tournaments
  await db.schema
    .createTable("pools")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("tournament_id", "integer", (col) =>
      col.references("tournaments.id").onDelete("cascade").notNull(),
    )
    .addColumn("name", "varchar(64)", (col) => col.notNull())
    .execute();

  // Add pool_id to tournament_players to assign players to pools
  await db.schema
    .alterTable("tournament_players")
    .addColumn("pool_id", "integer", (col) =>
      col.references("pools.id").onDelete("set null"),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove pool_id from tournament_players
  await db.schema
    .alterTable("tournament_players")
    .dropColumn("pool_id")
    .execute();

  // Drop pools table
  await db.schema.dropTable("pools").execute();
}
