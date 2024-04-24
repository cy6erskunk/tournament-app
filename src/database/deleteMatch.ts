"use server";

import { Result } from "@/types/result";
import { db } from "./database";

// TODO: Implement match deleting from this insert call
export async function deleteMatch(
  id: number
): Promise<Result<number, string>> {
  try {
    const res = await db
      .deleteFrom("matches")
      .where("id", "=", id)
      .executeTakeFirst();

    const count = Number(res.numDeletedRows)
    if (!count) {
      return { success: false, error: "Could not delete match" };
    }

    return { success: true, value: count };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not insert match" };
  }
}
