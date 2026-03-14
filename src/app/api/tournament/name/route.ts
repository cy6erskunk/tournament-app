"use server"

import { removeTournament } from "@/database/removeTournament";
import { updateTournament } from "@/database/updateTournament";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

type TournamentData = {
  name: string,
  id: number,
  require_submitter_identity?: boolean,
  public_results?: boolean,
  placement_size?: number | null,
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
    return new Response(`Error updating tournament to given input`, {
      status: 400
    })
  }

  const status = await updateTournament(data.value.id, {
    name: data.value.name,
    require_submitter_identity: data.value.require_submitter_identity,
    public_results: data.value.public_results,
    placement_size: data.value.placement_size,
  });

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
