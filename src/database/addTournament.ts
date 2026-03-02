"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import Tournament from "@/types/Tournament";
import { createPool } from "./getPools";

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
      await createPool(tournament.id as number, "Pool 1");
    }

    return { success: true, value: tournament as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not insert new tournament" };
  }
}
