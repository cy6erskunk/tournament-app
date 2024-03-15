import {
  addMatch,
  getTournamentToday,
  createTournamentToday,
  updateHgAndHr,
} from "@/database/addMatch";

// add new match
export async function POST(request: Request) {
  const formData = await request.formData();
  const form = {
    player1: formData.get("player1") as string,
    points1: Number(formData.get("points1")),
    player2: formData.get("player2") as string,
    points2: Number(formData.get("points2")),
  };

  // check winner
  let winner: string | null = null;
  if (form.points1 > form.points2) {
    winner = form.player1;
  } else if (form.points2 > form.points1) {
    winner = form.player2;
  }

  // get tournament id for matches table
  const currentDate = new Date();
  let tournament = await getTournamentToday(currentDate);

  // create new tournament if no tournaments today
  if (!tournament) {
    tournament = await createTournamentToday(currentDate);
  }

  // update player points in tournament
  updateHgAndHr(form.player1, tournament.id, form.points1, form.points2);
  updateHgAndHr(form.player2, tournament.id, form.points2, form.points1);

  // add match to matches table
  try {
    await addMatch(tournament.id, form.player1, form.player2, winner);
    return Response.json("Success");
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      return new Response(error.message, { status: 400 });
    }
    return new Response("error", {
      status: 400,
    });
  }
}
