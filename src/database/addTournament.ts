"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import Tournament from "@/types/Tournament";

export type RoundConfig = { type: "pools" | "elimination" };

export async function createTournament(
  date: Date,
  rounds: RoundConfig[],
  inputName: string,
  requireSubmitterIdentity: boolean = false,
  publicResults: boolean = false,
): Promise<Result<Tournament, string>> {
  if (!rounds || rounds.length === 0) {
    return { success: false, error: "At least one round is required" };
  }

  const invalidRound = rounds.find(
    (r) => r.type !== "pools" && r.type !== "elimination",
  );
  if (invalidRound) {
    return { success: false, error: `Unknown round type: "${invalidRound.type}"` };
  }

  try {
    const tournament = await db.transaction().execute(async (trx) => {
      const t = await trx
        .insertInto("tournaments")
        .values({
          name: inputName.trim(),
          date: date,
          require_submitter_identity: requireSubmitterIdentity,
          public_results: publicResults,
        })
        .returningAll()
        .executeTakeFirst();

      if (!t) {
        throw new Error("No tournament returned on insert");
      }

      // Create Pool 1 whenever the configuration includes any pool round
      const hasPoolRound = rounds.some((r) => r.type === "pools");
      if (hasPoolRound) {
        await trx
          .insertInto("pools")
          .values({ tournament_id: t.id as number, name: "Pool 1" })
          .execute();
      }

      await trx
        .insertInto("rounds")
        .values(
          rounds.map((r, i) => ({
            tournament_id: t.id as number,
            round_order: i + 1,
            type: r.type,
          })),
        )
        .execute();

      return t;
    });

    return { success: true, value: tournament as Tournament };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not insert new tournament";
    console.log(error);
    return { success: false, error: message };
  }
}
