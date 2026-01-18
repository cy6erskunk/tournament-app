"use server";
import { Result } from "@/types/result";
import { db } from "./database";

export interface QRAuditLog {
  id: number;
  tournament_id: number;
  tournament_name: string;
  match_number: number;
  round: number;
  player1: string;
  player2: string;
  player1_hits: number;
  player2_hits: number;
  winner: string;
  submitted_by_token: string | null;
  submitter_name: string | null;
  submitted_at: Date | null;
}

export async function getQRAuditLogs(): Promise<
  Result<QRAuditLog[], string>
> {
  try {
    const logs = await db
      .selectFrom("matches")
      .innerJoin("tournaments", "matches.tournament_id", "tournaments.id")
      .leftJoin(
        "submitter_devices",
        "matches.submitted_by_token",
        "submitter_devices.device_token"
      )
      .select([
        "matches.id",
        "matches.tournament_id",
        "tournaments.name as tournament_name",
        "matches.match as match_number",
        "matches.round",
        "matches.player1",
        "matches.player2",
        "matches.player1_hits",
        "matches.player2_hits",
        "matches.winner",
        "matches.submitted_by_token",
        "submitter_devices.submitter_name",
        "matches.submitted_at",
      ])
      .where("matches.submitted_by_token", "is not", null)
      .orderBy("matches.submitted_at", "desc")
      .execute();

    return { success: true, value: logs };
  } catch (error) {
    console.error("Error fetching QR audit logs:", error);
    return { success: false, error: "Error fetching QR audit logs" };
  }
}
