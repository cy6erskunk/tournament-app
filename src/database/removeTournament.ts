"use server";

import { Result } from "@/types/result";
import { db } from "./database";

export async function removeTournament(
  tournamentId: number,
): Promise<Result<string, string>> {
  try {
    await db
      .deleteFrom("tournaments")
      .where("id", "=", tournamentId)
      .executeTakeFirst();

    return { success: true, value: "Succesfully deleted tournament" };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error deleting tournament" };
  }
}
