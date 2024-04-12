import { getTournamentWithId } from "@/database/getTournament";
import { addPlayer } from "@/database/newPlayer";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

type PlayerData = {
  name: string,
  tournamentId: number,
}

export async function POST(request: Request) {
  const json = await request.text()
  const data = jsonParser<PlayerData>(json)

  const token = await getSession()
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403
    })
  }

  if (!data.success) {
    return new Response(`Error inserting new user`, {
      status: 400
    })
  }

  if (!data.value.name) {
    return new Response("Name must be set", {
      status: 500
    });
  }

  if (!data.value.tournamentId) {
    return new Response("Tournament must be set", {
      status: 500
    });
  }

  // get tournament id for matches table
  let tournamentResult = await getTournamentWithId(data.value.tournamentId);

  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 404 });
  }

  // add existing player to tournament_players table
  const addPlayerToTournament = await addPlayer(data.value.name, data.value.tournamentId);

  // check if player was added to tournament_players table
  if (!addPlayerToTournament.success) {
    return new Response("Error adding player to tournament_players table", {
      status: 400,
    });
  }
  return Response.json(addPlayerToTournament.value);
}
