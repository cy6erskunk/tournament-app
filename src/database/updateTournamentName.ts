"use server"

import { Result } from "@/types/result"
import { db } from "./database"

export async function updateTournamentName(name: string, id: number): Promise<Result<string, string>> {
  try {
    const result = await db
      .updateTable("tournaments")
      .set({ name }).where("id", "=", id)
      .executeTakeFirst()

    const count = Number(result.numUpdatedRows)
    if (!count) {
      return { success: false, error: "Could not update tournament name" }
    }

    return { success: true, value: `Updated tournament name to ${name}` }
  } catch (error) {
    console.log(error)
    return { success: false, error: "Could not update tournament name" };
  }
}
