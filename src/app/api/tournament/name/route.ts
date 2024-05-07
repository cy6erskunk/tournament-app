"use server"

import { removeTournament } from "@/database/removeTournament";
import { updateTournamentName } from "@/database/updateTournamentName";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

type TournamentData = {
  name: string,
  id: number,
}

export async function POST(request: Request) {
  const json = await request.text()
  const data = jsonParser<TournamentData>(json)

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
    return new Response(`Error updating tournament name to given input`, {
      status: 400
    })
  }

  const status = await updateTournamentName(data.value.name, data.value.id);

  if (!status.success) {
    return new Response(status.error, {
      status: 400
    })
  }

  return new Response(status.value, {
    status: 200
  })
}

// delete tournament
export async function DELETE(request: Request) {
  const json = await request.text();
  const data = jsonParser<TournamentData>(json);

  const token = await getSession();
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (token.value.role !== "admin") {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (!data.success) {
    return new Response(`Error parsing data on DELETE tournament API route`, {
      status: 400,
    });
  }

  const tournamentRemoved = await removeTournament(data.value.id);

  if (!tournamentRemoved.success) {
    return new Response(tournamentRemoved.error, {
      status: 400,
    });
  }

  return new Response(tournamentRemoved.value, {
    status: 200,
  });
}
