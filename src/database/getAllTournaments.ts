"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import Tournament from "@/types/Tournament";

export async function getAllTournaments(): Promise<
  Result<Tournament[], string>
> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .selectAll()
      .orderBy("id desc")
      .execute();

    return { success: true, value: tournaments as Tournament[] };
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return { success: false, error: "Error fetching tournaments" };
  }
}
