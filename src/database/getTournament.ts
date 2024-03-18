"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import { Tournaments } from "./types";

export async function getTournament(
  name: string,
): Promise<Result<Tournaments, string>> {
  try {
    const tournaments = (await db
      .selectFrom("tournaments")
      .where("name", "=", name)
      .selectAll()
      .executeTakeFirst()) as Tournaments | undefined;

    if (!tournaments) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error fetching tournaments" };
  }
}
