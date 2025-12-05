import { addQRMatch } from "@/database/addQRMatch";
import { generateQRMatchData } from "@/helpers/generateMatchId";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

interface GenerateQRRequest {
  player1: string;
  player2: string;
  tournamentId: number;
  round: number;
  match: number;
}

export async function POST(request: Request) {
  const json = await request.text();
  const data = jsonParser<GenerateQRRequest>(json);

  const token = await getSession();
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (!data.success) {
    return new Response(`Error reading request`, {
      status: 400,
    });
  }

  const { player1, player2, tournamentId, round, match } = data.value;

  // Generate match ID and QR data
  const PRODUCTION_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  const PREVIEW_URL = process.env.NEXT_PUBLIC_BASE_URL
    ? `https://${process.env.NEXT_PUBLIC_BASE_URL}`
    : `https://${process.env.VERCEL_URL}`;
  const DEVELOPMENT_URL = `http://localhost:3000`;
  const baseUrl =
    process.env.VERCEL_ENV === "production"
      ? PRODUCTION_URL
      : process.env.VERCEL_ENV === "preview"
      ? PREVIEW_URL
      : DEVELOPMENT_URL;   
  const qrMatchData = generateQRMatchData(
    player1,
    player2,
    tournamentId,
    round,
    baseUrl
  );

  // Log QR payload in non-production environments for debugging
  if (process.env.VERCEL_ENV !== "production") {
    console.log("[QR Debug] Generated QR match payload:", JSON.stringify(qrMatchData, null, 2));
  }

  // Store the match data for later retrieval
  const storeResult = await addQRMatch({
    match_id: qrMatchData.matchId,
    tournament_id: tournamentId,
    player1,
    player2,
    round,
    match,
  });

  if (!storeResult.success) {
    return new Response(`Error storing match data: ${storeResult.error}`, {
      status: 500,
    });
  }

  return new Response(JSON.stringify(qrMatchData));
}
