import { getTournamentWithId } from "@/database/getTournament";
import { newPlayer, addPlayer } from "@/database/newPlayer";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

type PlayerData = {
  name: string;
  tournamentId: number;
};

export async function POST(request: Request) {
  const json = await request.text();
  const data = jsonParser<PlayerData>(json);

  const token = await getSession();
  if (!token.success) {
    return Response.json(`Unauthorized access`, {
      status: 401,
    });
  }

  if (token.value.role !== 'admin') {
    return new Response(`Unauthorized access`, {
      status: 403
    });
  }

  if (!data.success) {
    return Response.json(data.error, {
      status: 422,
    });
  }

  if (!data.value.name) {
    return Response.json("Name must be set", {
      status: 500,
    });
  }

  if (!data.value.tournamentId) {
    return Response.json("Tournament must be set", {
      status: 500,
    });
  }

  let tournamentResult = await getTournamentWithId(data.value.tournamentId);

  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 400 });
  }

  // add new player
  const player = await newPlayer(data.value.name);

  // check if player was added
  if (!player.success) {
    return new Response("Error adding player to players table", {
      status: 400,
    });
  }

  // add existing player to tournament_players table
  const tournamentPlayer = await addPlayer(
    data.value.name,
    data.value.tournamentId,
  );

  // check if player was added to tournament_players table
  if (!tournamentPlayer.success) {
    return new Response("Error adding player to tournament_players table", {
      status: 400,
    });
  }
  return Response.json(tournamentPlayer.value);
}
