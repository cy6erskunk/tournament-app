"use server"

import { Result } from "@/types/result"
import { db } from "./database"

export async function updateTournament(
  id: number,
  data: {
    name: string;
    require_submitter_identity?: boolean;
    public_results?: boolean;
  },
): Promise<Result<string, string>> {
  try {
    const updateData: {
      name: string;
      require_submitter_identity?: boolean;
      public_results?: boolean;
    } = { name: data.name };

    if (data.require_submitter_identity !== undefined) {
      updateData.require_submitter_identity = data.require_submitter_identity;
    }

    if (data.public_results !== undefined) {
      if (data.public_results) {
        // Only validate format when trying to enable public results
        const tournament = await db
          .selectFrom("tournaments")
          .where("id", "=", id)
          .select("format")
          .executeTakeFirst();
        updateData.public_results = tournament?.format === "Round Robin";
      } else {
        updateData.public_results = false;
      }
    }

    const result = await db
      .updateTable("tournaments")
      .set(updateData)
      .where("id", "=", id)
      .executeTakeFirst();

    if (!Number(result.numUpdatedRows)) {
      return { success: false, error: "Could not update tournament" };
    }

    return { success: true, value: "Updated tournament successfully" };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not update tournament" };
  }
}
