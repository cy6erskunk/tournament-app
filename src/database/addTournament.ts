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
): Promise<Result<Tournament, string>> {
  try {
    const tournament = await db
      .insertInto("tournaments")
      .values({
        name: inputName.trim(),
        date: date,
        format: format,
        require_submitter_identity: requireSubmitterIdentity,
      })
      .returningAll()
      .executeTakeFirst();

    if (!tournament) {
      return { success: false, error: "No tournament returned on insert" };
    }

    // Round-robin tournaments always have at least one pool
    if (format === "Round Robin") {
      await db
        .insertInto("pools")
        .values({ tournament_id: tournament.id as number, name: "Pool 1" })
        .execute();
    }

    return { success: true, value: tournament as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not insert new tournament" };
  }
}
