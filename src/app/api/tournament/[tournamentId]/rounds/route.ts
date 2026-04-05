import { getRounds, createRoundNext, deleteRound } from "@/database/getRounds";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";
import type { RoundType } from "@/database/getRounds";

type CreateRoundData = {
  type: RoundType;
};

type DeleteRoundData = {
  roundId: number;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const id = Number(tournamentId);

  if (isNaN(id)) {
    return new Response("Invalid tournament ID", { status: 400 });
  }

  const result = await getRounds(id);

  if (!result.success) {
    return new Response(result.error, { status: 500 });
  }

  return Response.json(result.value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const session = await getSession();

  if (!session.success) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.value.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { tournamentId } = await params;
  const id = Number(tournamentId);

  if (isNaN(id)) {
    return new Response("Invalid tournament ID", { status: 400 });
  }

  const json = await request.text();
  const data = jsonParser<CreateRoundData>(json);

  if (!data.success) {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!data.value.type) {
    return new Response("Round type is required", { status: 400 });
  }

  const type = data.value.type;
  if (type !== "pools" && type !== "elimination") {
    return new Response("Invalid round type", { status: 400 });
  }

  const result = await createRoundNext(id, type);

  if (!result.success) {
    return new Response(result.error, { status: 500 });
  }

  return Response.json(result.value);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const session = await getSession();

  if (!session.success) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.value.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { tournamentId } = await params;
  const tournId = Number(tournamentId);

  if (isNaN(tournId)) {
    return new Response("Invalid tournament ID", { status: 400 });
  }

  const json = await request.text();
  const data = jsonParser<DeleteRoundData>(json);

  if (!data.success) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const roundId = Number(data.value.roundId);

  if (!Number.isSafeInteger(roundId) || roundId <= 0) {
    return new Response("Round ID is required", { status: 400 });
  }

  const roundsResult = await getRounds(tournId);

  if (!roundsResult.success) {
    return new Response(roundsResult.error, { status: 500 });
  }

  const roundBelongsToTournament = roundsResult.value.some(
    (r) => r.id === roundId,
  );

  if (!roundBelongsToTournament) {
    return new Response("Round not found", { status: 404 });
  }

  const result = await deleteRound(roundId, tournId);

  if (!result.success) {
    return new Response(result.error, { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
