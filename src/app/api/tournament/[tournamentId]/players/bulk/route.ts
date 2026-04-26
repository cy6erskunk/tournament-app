import { getTournamentWithId } from "@/database/getTournament";
import { newPlayer, addPlayer } from "@/database/newPlayer";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

type BulkBody = { names: string[] };

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const token = await getSession();
  if (!token.success) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (token.value.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { tournamentId } = await params;
  const id = Number(tournamentId);
  if (!id) {
    return new Response("Invalid tournament id", { status: 400 });
  }

  const tournamentResult = await getTournamentWithId(id);
  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 404 });
  }

  const json = await request.text();
  const data = jsonParser<BulkBody>(json);
  if (!data.success) {
    return new Response("Invalid request body", { status: 400 });
  }

  const names = [...new Set(
    data.value.names
      .map((n) => n.trim())
      .filter((n) => n.length > 0),
  )];

  if (names.length === 0) {
    return Response.json({ added: [], errors: [] });
  }

  // Ensure all names exist in the global players table in parallel
  await Promise.all(names.map((name) => newPlayer(name)));

  // Add all players to the tournament in parallel
  const addResults = await Promise.all(
    names.map(async (name) => ({ name, result: await addPlayer(name, id) })),
  );

  const added = addResults.filter(({ result }) => result.success).map(({ name }) => name);
  const errors = addResults.filter(({ result }) => !result.success).map(({ name }) => name);

  return Response.json({ added, errors });
}
