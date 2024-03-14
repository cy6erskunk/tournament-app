import { db } from "../../../database/database";

export async function POST(request: Request) {
  const formData = await request.formData();
  const name = formData.get("name");
  if (name === null) {
    return Response.json("Name cannot be null");
  }

  try {
    const result = await db
      .insertInto("tournament_players")
      .values({
        player_name: name.toString(),
        tournament_id: 1,
      })
      .executeTakeFirst();
    console.log(result);
    return Response.json("success");
  } catch (error) {
    return new Response("Error adding player", { status: 400 });
  }
}
