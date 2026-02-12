import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/helpers/getsession";
import { renamePlayer } from "@/database/renamePlayer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { name: oldName } = await params;

    const body = await request.json();
    const { newName } = body;

    if (typeof newName !== "string" || !newName.trim()) {
      return NextResponse.json(
        { error: "New name is required" },
        { status: 400 },
      );
    }

    const result = await renamePlayer(oldName, newName.trim());
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ playerName: result.value });
  } catch (error) {
    console.error("Error in PATCH /api/admin/players/[name]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
