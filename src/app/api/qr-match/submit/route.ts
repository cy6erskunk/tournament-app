import { updateMatch } from "@/database/updateMatch";
import { addMatch } from "@/database/addMatch";
import { getQRMatch, removeQRMatch } from "@/database/addQRMatch";
import { QRMatchResult } from "@/types/QRMatch";
import { jsonParser } from "@/helpers/jsonParser";
import { db } from "@/database/database";

function getCorsHeaders() {
  const isDev = process.env.NODE_ENV === 'development';
  const allowedOrigin = isDev ? '*' : process.env.CORS_ALLOWED_ORIGIN || '';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function POST(request: Request) {
  const json = await request.text();
  const data = jsonParser<QRMatchResult>(json);

  if (!data.success) {
    return new Response(`Error reading match result`, {
      status: 400,
      headers: getCorsHeaders(),
    });
  }

  const { matchId, deviceToken, player1_hits, player2_hits, winner } = data.value;

  // Retrieve match data from storage using matchId
  const matchDataResult = await getQRMatch(matchId);
  if (!matchDataResult.success) {
    return new Response(`Invalid or expired match ID`, {
      status: 404,
      headers: getCorsHeaders(),
    });
  }

  const matchData = matchDataResult.value;

  // Check if tournament requires submitter identity
  const tournament = await db
    .selectFrom('tournaments')
    .select(['require_submitter_identity'])
    .where('id', '=', matchData.tournament_id)
    .executeTakeFirst();

  if (!tournament) {
    return new Response(`Tournament not found`, {
      status: 404,
      headers: getCorsHeaders(),
    });
  }

  // Verify device token if tournament requires submitter identity
  let submitterToken: string | null = null;
  if (tournament.require_submitter_identity) {
    if (!deviceToken) {
      return new Response(`Device registration required for this tournament`, {
        status: 401,
        headers: getCorsHeaders(),
      });
    }

    // Verify device token exists in database
    const device = await db
      .selectFrom('submitter_devices')
      .select(['device_token', 'submitter_name'])
      .where('device_token', '=', deviceToken)
      .executeTakeFirst();

    if (!device) {
      return new Response(`Invalid device token`, {
        status: 401,
        headers: getCorsHeaders(),
      });
    }

    submitterToken = deviceToken;

    // Update last_used timestamp
    await db
      .updateTable('submitter_devices')
      .set({ last_used: new Date() })
      .where('device_token', '=', deviceToken)
      .execute();
  } else if (deviceToken) {
    // If device token is provided even when not required, validate and use it
    const device = await db
      .selectFrom('submitter_devices')
      .select(['device_token'])
      .where('device_token', '=', deviceToken)
      .executeTakeFirst();

    if (device) {
      submitterToken = deviceToken;
      await db
        .updateTable('submitter_devices')
        .set({ last_used: new Date() })
        .where('device_token', '=', deviceToken)
        .execute();
    }
  }

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
        headers: getCorsHeaders(),
      });
    }

    matchResult = addResult;
  } else {
    matchResult = updateResult;
  }

  // Update match with audit trail information
  const submittedAt = new Date();
  if (submitterToken) {
    try {
      await db
        .updateTable('matches')
        .set({
          submitted_by_token: submitterToken,
          submitted_at: submittedAt,
        })
        .where('player1', '=', matchData.player1)
        .where('player2', '=', matchData.player2)
        .where('tournament_id', '=', matchData.tournament_id)
        .where('round', '=', matchData.round)
        .where('match', '=', matchData.match)
        .execute();
    } catch (error) {
      console.error('Error updating audit trail:', error);
      // Don't fail the request if audit trail update fails
    }
  }

  // Clean up stored match data
  await removeQRMatch(matchId);

  // Prepare response with audit trail data included
  const responseMatch = {
    ...matchResult.value,
    submitted_by_token: submitterToken || null,
    submitted_at: submitterToken ? submittedAt : null,
  };

  return new Response(JSON.stringify({
    success: true,
    match: responseMatch
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(),
    },
  });
}