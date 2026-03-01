import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  const tournaments = await db
    .selectFrom("tournaments")
    .select("id")
    .where("format", "=", "Round Robin")
    .execute();

  for (const tournament of tournaments) {
    const existingPool = await db
      .selectFrom("pools")
      .select("id")
      .where("tournament_id", "=", tournament.id)
      .executeTakeFirst();

    if (existingPool) continue;

    const pool = await db
      .insertInto("pools")
      .values({ tournament_id: tournament.id, name: "Pool 1" })
      .returning("id")
      .executeTakeFirst();

    if (!pool) continue;

    await db
      .updateTable("tournament_players")
      .set({ pool_id: pool.id })
      .where("tournament_id", "=", tournament.id)
      .where("pool_id", "is", null)
      .execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  const defaultPools = await db
    .selectFrom("pools")
    .innerJoin("tournaments", "tournaments.id", "pools.tournament_id")
    .select("pools.id")
    .where("pools.name", "=", "Pool 1")
    .where("tournaments.format", "=", "Round Robin")
    .execute();

  for (const pool of defaultPools) {
    await db
      .updateTable("tournament_players")
      .set({ pool_id: null })
      .where("pool_id", "=", pool.id)
      .execute();

    await db.deleteFrom("pools").where("id", "=", pool.id).execute();
  }
}
