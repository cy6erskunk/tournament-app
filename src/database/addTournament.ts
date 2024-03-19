import { Result } from "@/types/result";
import { db } from "./database";

// create new tournament with Date
export async function createTournament(
  date: Date,
  inputName?: string,
): Promise<Result<number, string>> {
  const name = inputName ? inputName : "Daily Tournament " + date;
  try {
    const tournament = await db
      .insertInto("tournaments")
      .values({
        name,
        date,
        format: "old",
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    return { success: true, value: tournament.id };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not insert new tournament" };
  }
}
