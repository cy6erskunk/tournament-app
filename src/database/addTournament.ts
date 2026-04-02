"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import Tournament from "@/types/Tournament";

// create new tournament with date and format
export async function createTournament(
  date: Date,
  format: string,
  inputName: string,
  requireSubmitterIdentity: boolean = false,
  publicResults: boolean = false,
): Promise<Result<Tournament, string>> {
  try {
    const tournament = await db.transaction().execute(async (trx) => {
      const t = await trx
        .insertInto("tournaments")
        .values({
          name: inputName.trim(),
          date: date,
          format: format,
          require_submitter_identity: requireSubmitterIdentity,
          public_results: format === "Round Robin" ? publicResults : false,
        })
        .returningAll()
        .executeTakeFirst();

      if (!t) {
        throw new Error("No tournament returned on insert");
      }

      if (format === "Round Robin") {
        // Round-robin tournaments always start with one pool and two pool rounds
        await trx
          .insertInto("pools")
          .values({ tournament_id: t.id as number, name: "Pool 1" })
          .execute();

        await trx
          .insertInto("rounds")
          .values([
            { tournament_id: t.id as number, round_order: 1, type: "pools" },
            { tournament_id: t.id as number, round_order: 2, type: "pools" },
          ])
          .execute();
      } else if (format === "Brackets") {
        await trx
          .insertInto("rounds")
          .values({ tournament_id: t.id as number, round_order: 1, type: "elimination" })
          .execute();
      }

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
