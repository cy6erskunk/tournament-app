import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { getPlayer } from "@/database/getPlayers";
import { addPlayer } from "@/database/newPlayer";
import { removeTournamentPlayer } from "@/database/removeTournamentPlayer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const tournamentId = parseInt(id, 10);
  if (isNaN(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 },
    );
  }

  const playersResult = await getTournamentPlayers(tournamentId);
  const allPlayersResult = await getPlayer();

  const tournamentPlayerNames = playersResult.success
    ? playersResult.value.map((p) => p.player.player_name)
    : [];

  const availablePlayers = allPlayersResult.success
    ? allPlayersResult.value.filter(
        (name) => !tournamentPlayerNames.includes(name),
      )
    : [];

  return NextResponse.json({
    players: playersResult.success ? playersResult.value : [],
    availablePlayers,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const tournamentId = parseInt(id, 10);
  if (isNaN(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const { playerName } = body;

    if (!playerName) {
      return NextResponse.json(
        { error: "Player name is required" },
        { status: 400 },
      );
    }

    const result = await addPlayer(playerName, tournamentId);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/tournaments/[id]/players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const tournamentId = parseInt(id, 10);
  if (isNaN(tournamentId)) {
    return NextResponse.json(
      { error: "Invalid tournament ID" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const { playerName } = body;

    if (!playerName) {
      return NextResponse.json(
        { error: "Player name is required" },
        { status: 400 },
      );
    }

    const result = await removeTournamentPlayer(tournamentId, playerName);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: result.value });
  } catch (error) {
    console.error("Error in DELETE /api/admin/tournaments/[id]/players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
