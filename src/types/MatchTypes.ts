import type { Selectable, Insertable, Updateable } from "kysely";
import type { Matches } from "./Kysely";

/**
 * Helper types for working with Matches table
 * These types ensure type safety across different operations:
 * - MatchRow: For SELECT results (all fields present)
 * - NewMatch: For INSERT operations (optional fields like id, player1_hits can be omitted)
 * - MatchUpdate: For UPDATE operations
 * - MatchForm: For component forms (all required fields with proper types)
 */

export type MatchRow = Selectable<Matches>;           // For SELECT results
export type NewMatch = Insertable<Matches>;           // For INSERT operations
export type MatchUpdate = Updateable<Matches>;        // For UPDATE operations

// Type for component forms (all fields required, plain types not Generated<T>)
export type MatchForm = {
  player1: string;
  player2: string;
  player1_hits: number;
  player2_hits: number;
  winner: string | null;  // Can be null during form creation, determined before submission
  tournament_id: number;
  round: number;
  match: number;
};
