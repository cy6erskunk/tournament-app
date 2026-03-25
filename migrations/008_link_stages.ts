import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add stage_id to pools (nullable for backfill)
  await db.schema
    .alterTable("pools")
    .addColumn("stage_id", "integer", (col) =>
      col.references("stages.id").onDelete("cascade"),
    )
    .execute();

  // Backfill pools.stage_id from matching stage for the same tournament
  await sql`
    UPDATE pools p
    SET stage_id = s.id
    FROM stages s
    WHERE s.tournament_id = p.tournament_id
  `.execute(db);

  // Add stage_id to matches (nullable for backfill)
  await db.schema
    .alterTable("matches")
    .addColumn("stage_id", "integer", (col) =>
      col.references("stages.id").onDelete("cascade"),
    )
    .execute();

  // Backfill matches.stage_id from matching stage for the same tournament
  await sql`
    UPDATE matches m
    SET stage_id = s.id
    FROM stages s
    WHERE s.tournament_id = m.tournament_id
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("matches").dropColumn("stage_id").execute();
  await db.schema.alterTable("pools").dropColumn("stage_id").execute();
}
