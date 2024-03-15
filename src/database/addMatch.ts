import { db } from "./database";

// add match
export async function addMatch(
  tournamentId: number,
  player1: string,
  player2: string,
  winner: string | null
) {
  return await db
    .insertInto("matches")
    .values({
      match: 4,
      player1: player1,
      player2: player2,
      round: 1,
      tournament_id: tournamentId,
      winner: winner,
    })
    .executeTakeFirst();
}

// get tournament with Date
export async function getTournamentToday(dateToday: Date) {
  return await db
    .selectFrom("tournaments")
    .select("id")
    .where("date", "=", dateToday)
    .executeTakeFirst();
}

// create new tournament with Date
export async function createTournamentToday(dateToday: Date) {
  return await db
    .insertInto("tournaments")
    .values({
      name: "tournament test",
      date: dateToday,
      format: "old",
    })
    .returning("id")
    .executeTakeFirstOrThrow();
}

// update hits given and hits received
export async function updateHgAndHr(
  player: string,
  tournamentId: number,
  hits_given: number,
  hits_received: number
) {
  return await db
    .updateTable("tournament_players")
    .set((eb) => ({
      hits_given: eb("hits_given", "+", hits_given),
      hits_received: eb("hits_received", "+", hits_received),
    }))
    .where("player_name", "=", player)
    .where("tournament_id", "=", tournamentId)
    .executeTakeFirst();
}
