import { NextResponse } from "next/server";
import { getSession } from "@/helpers/getsession";
import { getQRAuditLogs } from "@/database/getQRAuditLogs";

export async function GET() {
  const session = await getSession();
  if (!session.success || session.value.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await getQRAuditLogs();
  if (!logs.success) {
    return NextResponse.json({ error: logs.error }, { status: 500 });
  }

  return NextResponse.json(logs.value);
}
