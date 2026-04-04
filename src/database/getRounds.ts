"use server";

import { db } from "./database";
import { sql } from "kysely";
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

// Inserts a new round with round_order computed atomically as MAX(round_order)+1,
// avoiding race conditions between concurrent POST requests.
export async function createRoundNext(
  tournamentId: number,
  type: RoundType,
): Promise<Result<RoundRow, string>> {
  try {
    const round = await db
      .insertInto("rounds")
      .values({
        tournament_id: tournamentId,
        type,
        round_order: sql<number>`(SELECT COALESCE(MAX(round_order), 0) + 1 FROM rounds WHERE tournament_id = ${tournamentId})`,
      })
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

export async function updateRound(
  roundId: number,
  tournamentId: number,
  data: Partial<{ round_order: number; type: RoundType }>,
): Promise<Result<RoundRow, string>> {
  try {
    const round = await db
      .updateTable("rounds")
      .set(data)
      .where("id", "=", roundId)
      .where("tournament_id", "=", tournamentId)
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
