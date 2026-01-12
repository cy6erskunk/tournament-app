import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getAllDevices } from "@/database/getDevices";
import { createDevice } from "@/database/createDevice";

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

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { deviceToken, submitterName } = body;

    if (!deviceToken || !submitterName) {
      return NextResponse.json(
        { error: "Device token and submitter name are required" },
        { status: 400 },
      );
    }

    const result = await createDevice(deviceToken, submitterName);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/devices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
