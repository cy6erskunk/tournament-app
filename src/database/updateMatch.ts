"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import { Matches } from "@/types/Kysely";
import NormalizedId from "@/types/NormalizedId";

// Type guard to check if the error has a code property
function isErrorWithCode(error: any): error is { code: string } {
  return typeof error === "object" && "code" in error;
}

export async function updateMatch(
  form: Omit<Matches, "id">, id: number
): Promise<Result<NormalizedId<Matches>, { value: string; code?: number }>> {
  try {
    const res = await db
      .updateTable("matches")
      .set({
        // TODO: Set required fields here
        // https://kysely.dev/docs/examples/UPDATE/single-row
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!res) {
      return { success: false, error: { value: "Could not insert match" } };
    }

    return { success: true, value: res };
  } catch (error) {
    console.log(error);
    // Check if the error is due to a unique key constraint violation
    if (isErrorWithCode(error) && error.code === "23505") {
      return {
        success: false,
        error: {
          value: "Unique key constraint violated",
          code: Number(error.code),
        },
      };
    }

    return { success: false, error: { value: "Could not insert match" } };
  }
}
