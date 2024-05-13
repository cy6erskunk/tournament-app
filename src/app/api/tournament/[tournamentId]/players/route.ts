"use server";

import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { getSession } from "@/helpers/getsession";

type Params = {
  params: {
    tournamentId: string;
  };
};

export async function GET(request: Request, { params }: Params) {
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

  if (
    !params.tournamentId ||
    Array.isArray(params.tournamentId) ||
    params.tournamentId == ""
  ) {
    return new Response(`Error fetching tournament players`, {
      status: 400,
    });
  }

  const tid = Number(params.tournamentId);

  if (!Number.isSafeInteger(tid)) {
    return new Response(`Error fetching tournament players`, {
      status: 400,
    });
  }

  const status = await getTournamentPlayers(tid);

  if (!status.success) {
    return new Response(status.error, {
      status: 400,
    });
  }

  return new Response(JSON.stringify(status.value), {
    status: 200,
  });
}
