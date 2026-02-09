import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getPlayer } from "@/database/getPlayers";

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
