import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getAllDevices } from "@/database/getDevices";

export async function GET() {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devices = await getAllDevices();
  if (!devices.success) {
    return NextResponse.json({ error: devices.error }, { status: 500 });
  }

  return NextResponse.json(devices.value);
}
