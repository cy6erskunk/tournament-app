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
  form: Omit<Matches, "id">,
): Promise<Result<NormalizedId<Matches>, { value: string; code?: number }>> {
  try {
    const match = await db
      .selectFrom("matches")
      .select(["player1", "player2"])
      .where((eb) =>
        eb.or([
          eb("player1", "=", form.player1),
          eb("player1", "=", form.player2),
        ]),
      )
      .where((eb) =>
        eb.or([
          eb("player2", "=", form.player2),
          eb("player2", "=", form.player1),
        ]),
      )
      .where("tournament_id", "=", form.tournament_id)
      .where("round", "=", form.round)
      .executeTakeFirst();

    let p1 = form.player1;
    let p1hits = form.player1_hits;
    let p2 = form.player2;
    let p2hits = form.player2_hits;

    if (match?.player1 !== form.player1) {
      p1 = form.player2;
      p1hits = form.player2_hits;
      p2 = form.player1;
      p2hits = form.player1_hits;
    }

    const res = await db
      .updateTable("matches")
      .set({
        player1_hits: p1hits,
        player2_hits: p2hits,
        winner: form.winner,
      })
      .where("player1", "=", p1)
      .where("player2", "=", p2)
      .where("tournament_id", "=", form.tournament_id)
      .where("round", "=", form.round)
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
