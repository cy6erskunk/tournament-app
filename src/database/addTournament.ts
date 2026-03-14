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
  placementSize: number | null = null,
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
          placement_size: format === "Brackets" ? placementSize : null,
        })
        .returningAll()
        .executeTakeFirst();

      if (!t) {
        throw new Error("No tournament returned on insert");
      }

      // Round-robin tournaments always have at least one pool
      if (format === "Round Robin") {
        await trx
          .insertInto("pools")
          .values({ tournament_id: t.id as number, name: "Pool 1" })
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
