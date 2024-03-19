import { getTournamentToday } from "@/database/getTournament";
import { newPlayer, addPlayer } from "@/database/newPlayer";

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

  // add new player
  const createNewPlayer = await newPlayer(name.toString());

  // check if player was added
  if (!createNewPlayer.success) {
    return new Response("Error adding player to players table", {
      status: 400,
    });
  }

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
