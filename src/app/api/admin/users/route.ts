import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getAllUsers } from "@/database/getUsers";
import { createUser } from "@/database/createUser";

export async function GET() {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const users = await getAllUsers();
  if (!users.success) {
    return NextResponse.json(
      { error: users.error },
      { status: 500 },
    );
  }

  return NextResponse.json(users.value);
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
    const { username, password, role } = body;

    if (!username || !password || !role) {
      return NextResponse.json(
        { error: "Username, password, and role are required" },
        { status: 400 },
      );
    }

    if (role !== "user" && role !== "admin") {
      return NextResponse.json(
        { error: "Role must be either 'user' or 'admin'" },
        { status: 400 },
      );
    }

    const result = await createUser(username, password, role);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
