"use server";

import { Result } from "@/types/result";
import { db } from "./database";

export async function renamePlayer(
  oldName: string,
  newName: string,
): Promise<Result<string, string>> {
  try {
    if (!newName.trim()) {
      return { success: false, error: "Player name cannot be empty" };
    }

    if (newName.length > 16) {
      return { success: false, error: "Player name too long (max 16 characters)" };
    }

    const existing = await db
      .selectFrom("players")
      .select("player_name")
      .where((eb) =>
        eb(eb.fn("lower", ["player_name"]), "=", newName.toLowerCase()),
      )
      .executeTakeFirst();

    if (existing && existing.player_name !== oldName) {
      return { success: false, error: "A player with that name already exists" };
    }

    const res = await db
      .updateTable("players")
      .set({ player_name: newName.trim() })
      .where("player_name", "=", oldName)
      .executeTakeFirst();

    const count = Number(res.numUpdatedRows);
    if (!count) {
      return { success: false, error: "Player not found" };
    }

    return { success: true, value: newName.trim() };
  } catch (error) {
    console.error("Error renaming player:", error);
    return { success: false, error: "Error renaming player" };
  }
}
