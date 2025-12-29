import { z } from 'zod';

/**
 * Zod schema for validating QR match result submissions
 *
 * Validates:
 * - matchId is a non-empty string
 * - deviceToken is an optional string
 * - player1_hits is a finite, non-negative integer (rejects NaN, Infinity, decimals)
 * - player2_hits is a finite, non-negative integer (rejects NaN, Infinity, decimals)
 * - winner is a non-empty string
 */
export const QRMatchResultSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  deviceToken: z.string().optional(),
  player1_hits: z
    .number()
    .finite('Player 1 hits must be a finite number')
    .int('Player 1 hits must be an integer')
    .nonnegative('Player 1 hits cannot be negative'),
  player2_hits: z
    .number()
    .finite('Player 2 hits must be a finite number')
    .int('Player 2 hits must be an integer')
    .nonnegative('Player 2 hits cannot be negative'),
  winner: z.string().min(1, 'Winner is required'),
});

/**
 * Extended schema that includes match data for comprehensive validation
 * Uses Zod's superRefine to validate that winner matches one of the players
 */
export const QRMatchSubmissionSchema = z
  .object({
    matchId: z.string().min(1, 'Match ID is required'),
    deviceToken: z.string().optional(),
    player1_hits: z
      .number()
      .finite('Player 1 hits must be a finite number')
      .int('Player 1 hits must be an integer')
      .nonnegative('Player 1 hits cannot be negative'),
    player2_hits: z
      .number()
      .finite('Player 2 hits must be a finite number')
      .int('Player 2 hits must be an integer')
      .nonnegative('Player 2 hits cannot be negative'),
    winner: z.string().min(1, 'Winner is required'),
    // Match data from database
    player1: z.string(),
    player2: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.winner !== data.player1 && data.winner !== data.player2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid winner: "${data.winner}". Winner must be either "${data.player1}" or "${data.player2}"`,
        path: ['winner'],
      });
    }
  });

/**
 * Additional validation function to verify winner matches one of the players
 * This needs to be called after retrieving match data from storage
 *
 * @param winner - The winner name from submission
 * @param player1 - First player name from match data
 * @param player2 - Second player name from match data
 * @returns ValidationResult with success boolean and optional error message
 */
export function validateWinner(winner: string, player1: string, player2: string): {
  success: boolean;
  error?: string;
} {
  if (winner !== player1 && winner !== player2) {
    return {
      success: false,
      error: `Invalid winner: "${winner}". Winner must be either "${player1}" or "${player2}"`,
    };
  }

  return { success: true };
}
