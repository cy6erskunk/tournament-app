import { db } from "@/database/database";
import { getTournamentToday } from "@/database/addMatch";
import { TournamentPlayers } from "@/database/types";
import { Player } from "@/types/Player";

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name");
  if (name === null) {
    return new Response("Must include a name", { status: 400 });
  }

  // get tournament id for matches table
  const currentDate = new Date();
  let tournamentResult = await getTournamentToday(currentDate);

  // TODO: create new tournament if no tournaments today
  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 404 });
  }

  const tournamentId = Number(tournamentResult.value.id);

  try {
    const result = await db
      .insertInto("tournament_players")
      .values({
        player_name: name.toString(),
        tournament_id: tournamentId,
        hits_given: 0,
        hits_received: 0,
      })
      .returningAll()
      .executeTakeFirst() as TournamentPlayers | undefined;

    if (!result) {
      return new Response("Not able to add user", { status: 400 });
    }

    const player: Player = {
      player: result,
      matches: [],
    }

    console.log(player);
    return Response.json(player);
  } catch (error) {
    return new Response("Error adding player", { status: 400 });
  }
}
