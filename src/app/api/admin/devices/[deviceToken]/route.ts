import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { deleteDevice } from "@/database/deleteDevice";

type RouteParams = {
  params: Promise<{
    deviceToken: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { deviceToken } = await params;
  const result = await deleteDevice(deviceToken);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: "Device deleted successfully" });
}
