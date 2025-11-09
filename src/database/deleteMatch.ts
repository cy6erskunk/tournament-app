"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import { NewMatch } from "@/types/MatchTypes";

// TODO: Implement match deleting from this insert call
export async function deleteMatch(
  form: NewMatch,
): Promise<Result<number, string>> {
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
    let p2 = form.player2;

    if (match?.player1 !== form.player1) {
      p1 = form.player2;
      p2 = form.player1;
    }

    const res = await db
      .deleteFrom("matches")
      .where("player1", "=", p1)
      .where("player2", "=", p2)
      .where("tournament_id", "=", form.tournament_id)
      .where("round", "=", form.round)
      .executeTakeFirst();

    const count = Number(res.numDeletedRows);
    if (!count) {
      return { success: false, error: "Could not delete match" };
    }

    return { success: true, value: count };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not delete match" };
  }
}
