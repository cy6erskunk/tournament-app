import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getAllTournaments } from "@/database/getAllTournaments";

export async function GET() {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const tournaments = await getAllTournaments();
  if (!tournaments.success) {
    return NextResponse.json(
      { error: tournaments.error },
      { status: 500 },
    );
  }

  return NextResponse.json(tournaments.value);
}
