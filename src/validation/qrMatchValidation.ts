import { z } from 'zod';

/**
 * Comprehensive validation schema for QR match submissions
 *
 * Validates complete submission including:
 * - Request data (matchId, hits, winner, optional deviceToken)
 * - Match data from database (player1, player2)
 * - Winner matches one of the actual players (using superRefine)
 *
 * Protects against:
 * - Negative hit counts
 * - Non-integer hit counts (decimals like 5.5)
 * - Special numeric values (NaN, Infinity, -Infinity)
 * - Invalid winner names
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
 * Legacy validation function for winner matching
 * Kept for backward compatibility but prefer using QRMatchSubmissionSchema
 *
 * @deprecated Use QRMatchSubmissionSchema with superRefine instead
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
