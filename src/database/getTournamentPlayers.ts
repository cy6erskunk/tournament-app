import { db } from "./database";

// get tournament players
export async function getTournamentPlayers(tournamentId: number) {
  return await db
    .selectFrom("tournament_players")
    .selectAll()
    .where("tournament_id", "=", tournamentId)
    .execute();
}
