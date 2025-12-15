"use server"

import { Result } from "@/types/result"
import { db } from "./database"

export async function updateTournamentName(name: string, id: number, requireSubmitterIdentity?: boolean): Promise<Result<string, string>> {
  try {
    const updateData: { name: string; require_submitter_identity?: boolean } = { name };

    // Only include require_submitter_identity if it's explicitly provided
    if (requireSubmitterIdentity !== undefined) {
      updateData.require_submitter_identity = requireSubmitterIdentity;
    }

    const result = await db
      .updateTable("tournaments")
      .set(updateData)
      .where("id", "=", id)
      .executeTakeFirst()

    const count = Number(result.numUpdatedRows)
    if (!count) {
      return { success: false, error: "Could not update tournament" }
    }

    return { success: true, value: `Updated tournament successfully` }
  } catch (error) {
    console.log(error)
    return { success: false, error: "Could not update tournament" };
  }
}
