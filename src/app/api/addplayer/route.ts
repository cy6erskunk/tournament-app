import { getTournamentWithId } from "@/database/getTournament";
import { addPlayer } from "@/database/newPlayer";

export async function POST(request: Request) {
  const res = await request.json();

  if (res.name === null) {
    return new Response("Must include a name", { status: 400 });
  }

  // get tournament id for matches table
  let tournamentResult = await getTournamentWithId(res.tournamentId);

  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 404 });
  }

  const tournamentId = Number(tournamentResult.value.id);

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
