import { Result } from "@/types/result";
import { QRMatchResult } from "@/types/QRMatch";

interface MatchValidationContext {
  player1: string;
  player2: string;
}

export type MatchResultValidationResult = Result<QRMatchResult, string>;

/**
 * Validates match result data for QR match submission
 * 
 * Validates:
 * - All required fields are present
 * - Hit counts are non-negative integers
 * - Winner matches one of the player names
 * - Data types are correct
 */
export function validateMatchResult(
  data: unknown,
  context: MatchValidationContext
): MatchResultValidationResult {
  // Type guard: check if data is an object (and not an array or null)
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { success: false, error: "Invalid match result data: must be an object" };
  }

  const result = data as Record<string, unknown>;

  // Validate required fields are present
  if (!('matchId' in result) || typeof result.matchId !== 'string') {
    return { success: false, error: "Missing or invalid matchId" };
  }

  if (!('player1_hits' in result)) {
    return { success: false, error: "Missing player1_hits" };
  }

  if (!('player2_hits' in result)) {
    return { success: false, error: "Missing player2_hits" };
  }

  if (!('winner' in result) || typeof result.winner !== 'string') {
    return { success: false, error: "Missing or invalid winner" };
  }

  // Validate hit counts are numbers
  if (typeof result.player1_hits !== 'number') {
    return { success: false, error: "Invalid player1_hits: must be a number" };
  }

  if (typeof result.player2_hits !== 'number') {
    return { success: false, error: "Invalid player2_hits: must be a number" };
  }

  // Validate hit counts are integers
  if (!Number.isInteger(result.player1_hits)) {
    return { success: false, error: "Invalid player1_hits: must be an integer" };
  }

  if (!Number.isInteger(result.player2_hits)) {
    return { success: false, error: "Invalid player2_hits: must be an integer" };
  }

  // Validate hit counts are non-negative
  if (result.player1_hits < 0) {
    return { success: false, error: "Invalid player1_hits: cannot be negative" };
  }

  if (result.player2_hits < 0) {
    return { success: false, error: "Invalid player2_hits: cannot be negative" };
  }

  // Validate winner matches one of the player names
  if (result.winner !== context.player1 && result.winner !== context.player2) {
    return { 
      success: false, 
      error: `Invalid winner: must be either "${context.player1}" or "${context.player2}"` 
    };
  }

  // Validate deviceToken if present
  if ('deviceToken' in result && result.deviceToken !== undefined && typeof result.deviceToken !== 'string') {
    return { success: false, error: "Invalid deviceToken: must be a string" };
  }

  // All validation passed - construct validated result
  const validatedResult: QRMatchResult = {
    matchId: result.matchId,
    player1_hits: result.player1_hits,
    player2_hits: result.player2_hits,
    winner: result.winner,
  };

  // Include deviceToken if present
  if ('deviceToken' in result && typeof result.deviceToken === 'string') {
    validatedResult.deviceToken = result.deviceToken;
  }

  return { success: true, value: validatedResult };
}
