import { getPools, createPool, deletePool } from "@/database/getPools";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

type CreatePoolData = {
  name?: string;
};

type DeletePoolData = {
  poolId: number;
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

  const result = await getPools(id);

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
  const data = jsonParser<CreatePoolData>(json);
  const providedName = data.success ? (data.value.name ?? "").trim() : "";

  let name = providedName;
  if (!name) {
    const existingPools = await getPools(id);
    const count = existingPools.success ? existingPools.value.length : 0;
    name = `Pool ${count + 1}`;
  }

  const result = await createPool(id, name);

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
  const data = jsonParser<DeletePoolData>(json);

  if (!data.success || !data.value.poolId) {
    return new Response("Pool ID is required", { status: 400 });
  }

  const result = await deletePool(data.value.poolId);

  if (!result.success) {
    return new Response(result.error, { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
