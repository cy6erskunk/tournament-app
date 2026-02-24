import { assignPlayerToPool } from "@/database/getPools";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

type AssignPlayerData = {
  playerName: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string; poolId: string }> },
) {
  const session = await getSession();

  if (!session.success) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (session.value.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { tournamentId, poolId } = await params;
  const tournId = Number(tournamentId);
  const pId = Number(poolId);

  if (isNaN(tournId) || isNaN(pId)) {
    return new Response("Invalid tournament ID or pool ID", { status: 400 });
  }

  const json = await request.text();
  const data = jsonParser<AssignPlayerData>(json);

  if (!data.success || !data.value.playerName) {
    return new Response("Player name is required", { status: 400 });
  }

  // poolId of 0 means unassign the player from any pool
  const actualPoolId = pId === 0 ? null : pId;
  const result = await assignPlayerToPool(
    data.value.playerName,
    tournId,
    actualPoolId,
  );

  if (!result.success) {
    return new Response(result.error, { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
