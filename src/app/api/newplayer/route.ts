import { getTournamentWithId } from "@/database/getTournament";
import { newPlayer, addPlayer } from "@/database/newPlayer";

export async function POST(request: Request) {
  const res = await request.json();

  if (res.name === null) {
    return Response.json("Name cannot be null");
  }

  let tournamentResult = await getTournamentWithId(res.tournamentId);

  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 400 });
  }

  const tournamentId = Number(tournamentResult.value.id);

  // add new player
  const createNewPlayer = await newPlayer(res.name);

  // check if player was added
  if (!createNewPlayer.success) {
    return new Response("Error adding player to players table", {
      status: 400,
    });
  }

  // add existing player to tournament_players table
  const addPlayerToTournament = await addPlayer(res.name, tournamentId);

  // check if player was added to tournament_players table
  if (!addPlayerToTournament.success) {
    return new Response("Error adding player to tournament_players table", {
      status: 400,
    });
  }
  return Response.json(addPlayerToTournament.value);
}
