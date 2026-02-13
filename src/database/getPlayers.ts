"use server";
import { db } from "@/database/database";
import { Result } from "@/types/result";

export async function getPlayer(): Promise<Result<string[], string>> {
  try {
    const user = await db
      .selectFrom("players")
      .select("player_name")
      .orderBy("player_name")
      .limit(500)
      .execute();
    const users = user.map((player) => player.player_name);
    if (!users) {
      return {
        success: false,
        error: "No players found",
      };
    }
    return { success: true, value: users };
  } catch (error) {
    return { success: false, error: "No players found" };
  }
}
