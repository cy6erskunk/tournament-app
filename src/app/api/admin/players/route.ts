import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getPlayer } from "@/database/getPlayers";
import { newPlayer } from "@/database/newPlayer";

export async function GET() {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const players = await getPlayer();
  if (!players.success) {
    return NextResponse.json(
      { error: players.error },
      { status: 500 },
    );
  }

  return NextResponse.json(players.value);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { playerName } = body;

    if (!playerName || !playerName.trim()) {
      return NextResponse.json(
        { error: "Player name is required" },
        { status: 400 },
      );
    }

    if (playerName.length > 16) {
      return NextResponse.json(
        { error: "Player name too long (max 16 characters)" },
        { status: 400 },
      );
    }

    const result = await newPlayer(playerName.trim());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ playerName: playerName.trim() }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
