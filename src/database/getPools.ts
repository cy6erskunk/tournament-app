"use server";

import { db } from "./database";
import { Result } from "@/types/result";
import { Selectable } from "kysely";
import { Pools } from "@/types/Kysely";

export type PoolRow = Selectable<Pools>;

export async function getPools(
  tournamentId: number,
): Promise<Result<PoolRow[], string>> {
  try {
    const pools = await db
      .selectFrom("pools")
      .selectAll()
      .where("tournament_id", "=", tournamentId)
      .orderBy("name", "asc")
      .execute();

    return { success: true, value: pools };
  } catch {
    return { success: false, error: "Could not fetch pools" };
  }
}

export async function createPool(
  tournamentId: number,
  name: string,
): Promise<Result<PoolRow, string>> {
  try {
    const pool = await db
      .insertInto("pools")
      .values({ tournament_id: tournamentId, name })
      .returningAll()
      .executeTakeFirst();

    if (!pool) {
      return { success: false, error: "Could not create pool" };
    }

    return { success: true, value: pool };
  } catch {
    return { success: false, error: "Could not create pool" };
  }
}

export async function deletePool(
  poolId: number,
): Promise<Result<undefined, string>> {
  try {
    await db.deleteFrom("pools").where("id", "=", poolId).execute();

    return { success: true, value: undefined };
  } catch {
    return { success: false, error: "Could not delete pool" };
  }
}

export async function assignPlayerToPool(
  playerName: string,
  tournamentId: number,
  poolId: number | null,
): Promise<Result<undefined, string>> {
  try {
    await db
      .updateTable("tournament_players")
      .set({ pool_id: poolId })
      .where("player_name", "=", playerName)
      .where("tournament_id", "=", tournamentId)
      .execute();

    return { success: true, value: undefined };
  } catch {
    return { success: false, error: "Could not assign player to pool" };
  }
}
