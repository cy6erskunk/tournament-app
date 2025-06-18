import { updateMatch } from "@/database/updateMatch";
import { addMatch } from "@/database/addMatch";
import { getQRMatch, removeQRMatch } from "@/database/addQRMatch";
import { QRMatchResult } from "@/types/QRMatch";
import { jsonParser } from "@/helpers/jsonParser";

export async function POST(request: Request) {
  const json = await request.text();
  const data = jsonParser<QRMatchResult>(json);

  if (!data.success) {
    return new Response(`Error reading match result`, {
      status: 400,
    });
  }

  const { matchId, player1_hits, player2_hits, winner } = data.value;

  // Retrieve match data from storage using matchId
  const matchDataResult = await getQRMatch(matchId);
  if (!matchDataResult.success) {
    return new Response(`Invalid or expired match ID: ${matchDataResult.error}`, {
      status: 404,
    });
  }

  const matchData = matchDataResult.value;

  // Check if this is a new match or an update to existing match
  // First try to update an existing match
  const updateResult = await updateMatch({
    player1: matchData.player1,
    player2: matchData.player2,
    tournament_id: matchData.tournament_id,
    round: matchData.round,
    match: matchData.match,
    player1_hits,
    player2_hits,
    winner,
  });

  let matchResult;
  if (!updateResult.success) {
    // If update fails, try to add as new match
    const addResult = await addMatch({
      player1: matchData.player1,
      player2: matchData.player2,
      tournament_id: matchData.tournament_id,
      round: matchData.round,
      match: matchData.match,
      player1_hits,
      player2_hits,
      winner,
    });

    if (!addResult.success) {
      return new Response(`Error adding/updating match: ${addResult.error}`, {
        status: 400,
      });
    }
    
    matchResult = addResult;
  } else {
    matchResult = updateResult;
  }

  // Clean up stored match data
  await removeQRMatch(matchId);

  return new Response(JSON.stringify({ 
    success: true, 
    match: matchResult.value 
  }));
}