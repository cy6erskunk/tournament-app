"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import Tournament from "@/types/Tournament";

// create new tournament with date and format
export async function createTournament(
  date: Date,
  format: string,
  inputName: string,
): Promise<Result<Tournament, string>> {
  try {
    const tournament = await db
      .insertInto("tournaments")
      .values({
        name: inputName,
        date: date,
        format: format,
      })
      .returningAll()
      .executeTakeFirst();

    if (!tournament) {
      return { success: false, error: "No tournament returned on insert" };
    }

    return { success: true, value: tournament as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not insert new tournament" };
  }
}
