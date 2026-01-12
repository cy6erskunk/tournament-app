import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getUser } from "@/database/getUsers";
import { updateUserRole, updateUserPassword } from "@/database/updateUser";
import { deleteUser } from "@/database/deleteUser";

type RouteParams = {
  params: Promise<{
    username: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { username } = await params;
  const user = await getUser(username);
  if (!user.success) {
    return NextResponse.json(
      { error: user.error },
      { status: 404 },
    );
  }

  return NextResponse.json(user.value);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { username } = await params;
    const body = await request.json();
    const { role, password } = body;

    if (role && password) {
      return NextResponse.json(
        { error: "Cannot update both role and password in the same request" },
        { status: 400 },
      );
    }

    if (role) {
      if (role !== "user" && role !== "admin") {
        return NextResponse.json(
          { error: "Role must be either 'user' or 'admin'" },
          { status: 400 },
        );
      }

      const result = await updateUserRole(username, role);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 },
        );
      }

      return NextResponse.json(result.value);
    }

    if (password) {
      const result = await updateUserPassword(username, password);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 },
        );
      }

      return NextResponse.json({ message: "Password updated successfully" });
    }

    return NextResponse.json(
      { error: "Either role or password must be provided" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/[username]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { username } = await params;
  const result = await deleteUser(username);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: "User deleted successfully" });
}
