"use server";

import { db } from "./database";
import { Result } from "@/types/result";
import type { Selectable } from "kysely";
import type { Stages } from "@/types/Kysely";

export type StageRow = Selectable<Stages>;
export type StageType = "pools" | "elimination";

export async function getStages(
  tournamentId: number,
): Promise<Result<StageRow[], string>> {
  try {
    const stages = await db
      .selectFrom("stages")
      .selectAll()
      .where("tournament_id", "=", tournamentId)
      .orderBy("stage_order", "asc")
      .execute();

    return { success: true, value: stages };
  } catch {
    return { success: false, error: "Could not fetch stages" };
  }
}

export async function createStage(
  tournamentId: number,
  type: StageType,
  stageOrder: number,
  name: string = "",
  rounds: number = 1,
): Promise<Result<StageRow, string>> {
  try {
    const stage = await db
      .insertInto("stages")
      .values({ tournament_id: tournamentId, type, stage_order: stageOrder, name, rounds })
      .returningAll()
      .executeTakeFirst();

    if (!stage) {
      return { success: false, error: "Could not create stage" };
    }

    return { success: true, value: stage };
  } catch {
    return { success: false, error: "Could not create stage" };
  }
}

export async function deleteStage(
  stageId: number,
  tournamentId: number,
): Promise<Result<undefined, string>> {
  try {
    await db
      .deleteFrom("stages")
      .where("id", "=", stageId)
      .where("tournament_id", "=", tournamentId)
      .execute();

    return { success: true, value: undefined };
  } catch {
    return { success: false, error: "Could not delete stage" };
  }
}

export async function updateStage(
  stageId: number,
  data: Partial<Pick<StageRow, "name" | "stage_order" | "type" | "rounds">>,
): Promise<Result<StageRow, string>> {
  try {
    const stage = await db
      .updateTable("stages")
      .set(data)
      .where("id", "=", stageId)
      .returningAll()
      .executeTakeFirst();

    if (!stage) {
      return { success: false, error: "Stage not found" };
    }

    return { success: true, value: stage };
  } catch {
    return { success: false, error: "Could not update stage" };
  }
}
