"use server";

import { db } from "./database";
import { Result } from "@/types/result";
import type { Selectable } from "kysely";
import type { Rounds } from "@/types/Kysely";

export type RoundRow = Selectable<Rounds>;
export type RoundType = "pools" | "elimination";

export async function getRounds(
  tournamentId: number,
): Promise<Result<RoundRow[], string>> {
  try {
    const rounds = await db
      .selectFrom("rounds")
      .selectAll()
      .where("tournament_id", "=", tournamentId)
      .orderBy("round_order", "asc")
      .execute();

    return { success: true, value: rounds };
  } catch {
    return { success: false, error: "Could not fetch rounds" };
  }
}

export async function createRound(
  tournamentId: number,
  type: RoundType,
  roundOrder: number,
): Promise<Result<RoundRow, string>> {
  try {
    const round = await db
      .insertInto("rounds")
      .values({ tournament_id: tournamentId, type, round_order: roundOrder })
      .returningAll()
      .executeTakeFirst();

    if (!round) {
      return { success: false, error: "Could not create round" };
    }

    return { success: true, value: round };
  } catch {
    return { success: false, error: "Could not create round" };
  }
}

export async function deleteRound(
  roundId: number,
  tournamentId: number,
): Promise<Result<undefined, string>> {
  try {
    await db
      .deleteFrom("rounds")
      .where("id", "=", roundId)
      .where("tournament_id", "=", tournamentId)
      .execute();

    return { success: true, value: undefined };
  } catch {
    return { success: false, error: "Could not delete round" };
  }
}

export async function updateRound(
  roundId: number,
  data: Partial<Pick<RoundRow, "round_order" | "type">>,
): Promise<Result<RoundRow, string>> {
  try {
    const round = await db
      .updateTable("rounds")
      .set(data)
      .where("id", "=", roundId)
      .returningAll()
      .executeTakeFirst();

    if (!round) {
      return { success: false, error: "Round not found" };
    }

    return { success: true, value: round };
  } catch {
    return { success: false, error: "Could not update round" };
  }
}
