import { db } from "@/database/database";
import { getTournamentToday } from "@/database/addMatch";
import { Player } from "@/types/Player";

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name");
  if (name === null) {
    return Response.json("Name cannot be null");
  }
  const currentDate = new Date();
  let tournamentResult = await getTournamentToday(currentDate);

  // create new tournament if no tournaments today
  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 400 });
  }

  const tournamentId = Number(tournamentResult.value.id);

  try {
    const result = await db
      .insertInto("players")
      .values({
        player_name: name.toString(),
      })
      .executeTakeFirst();
    console.log(result);
  } catch (error) {
    return new Response("Error adding player", { status: 400 });
  }

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
      .executeTakeFirst();

    if (!result) {
      return new Response("Error adding player", { status: 400 });
    }

    const player: Player = {
      player: result,
      matches: [],
    };

    return Response.json(player);
  } catch (error) {
    return new Response("Error adding player", { status: 400 });
  }
}
