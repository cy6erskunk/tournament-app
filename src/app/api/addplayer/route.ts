import { db } from "../../../database/database";
import { getTournamentToday, createTournamentToday } from "@/database/addMatch";

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name");
  if (name === null) {
    return Response.json("Name cannot be null");
  }

  const currentDate = new Date();
  let tournament = await getTournamentToday(currentDate);

  // create new tournament if no tournaments today
  if (!tournament) {
    tournament = await createTournamentToday(currentDate);
  }

  try {
    const result = await db
      .insertInto("tournament_players")
      .values({
        player_name: name.toString(),
        tournament_id: tournament.id,
        hits_given: 0,
        hits_received: 0,
      })
      .executeTakeFirst();
    console.log(result);
    return Response.json("success");
  } catch (error) {
    return new Response("Error adding player", { status: 400 });
  }
}
