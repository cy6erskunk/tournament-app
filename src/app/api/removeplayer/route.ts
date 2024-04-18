import { removeTournamentPlayer } from "@/database/removeTournamentPlayer"
import { getSession } from "@/helpers/getsession"
import { jsonParser } from "@/helpers/jsonParser"

export type PlayerData = {
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

  if (token.value.role !== 'admin') {
    return new Response(`Unauthorized access`, {
      status: 403
    })
  }

  if (!data.success) {
    return new Response(`Error removing player`, {
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
  let tournamentResult = await removeTournamentPlayer(data.value.tournamentId, data.value.name);

  if (!tournamentResult.success) {
    return new Response(tournamentResult.error, { status: 404 });
  }

  return Response.json(tournamentResult.value);
}
