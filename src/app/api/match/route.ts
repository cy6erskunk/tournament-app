import { addMatch, updateHgAndHr } from "@/database/addMatch";
import { getTournamentToday } from "@/database/getTournament";

// add new match
export async function POST(request: Request) {
  const req = await request.json();
  const form = req.formData;
  const round = req.round;

  // check winner
  let winner: string | null = null;
  if (form.points1 > form.points2) {
    winner = form.player1;
  } else if (form.points2 > form.points1) {
    winner = form.player2;
  }

  // get tournament id for matches table
  const currentDate = new Date();
  let tournamentResult = await getTournamentToday(currentDate);

  // create new tournament if no tournaments today
  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 404 });
  }

  const tournamentId = Number(tournamentResult.value.id);

  // update player points in tournament
  // TODO: Combine these two queries
  const p1Result = await updateHgAndHr(
    form.player1,
    tournamentId,
    form.points1,
    form.points2,
  );

  if (!p1Result.success) return new Response(p1Result.error, { status: 400 });

  const p2Result = await updateHgAndHr(
    form.player2,
    tournamentId,
    form.points2,
    form.points1,
  );

  if (!p2Result.success) return new Response(p2Result.error, { status: 400 });

  // add match to matches table
  const matchResult = await addMatch(
    tournamentId,
    form.player1,
    form.player2,
    round,
    winner,
  );

  if (!matchResult.success) {
    return new Response(`Error adding match: ${matchResult.error}`, {
      status: 400,
    });
  }

  return Response.json(matchResult.value);
}
