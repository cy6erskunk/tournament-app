import { getTournamentToday } from "@/database/addMatch";
import { addPlayer } from "@/database/newPlayer";

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

  // add existing player to tournament_players table
  const addPlayerToTournament = await addPlayer(name.toString(), tournamentId);

  // check if player was added to tournament_players table
  if (!addPlayerToTournament.success) {
    return new Response("Error adding player to tournament_players table", {
      status: 400,
    });
  }
  return Response.json(addPlayerToTournament.value);
}
