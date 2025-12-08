export interface QRMatchData {
  matchId: string;
  player1: string;
  player2: string;
  tournamentId: number;
  round: number;
  baseUri: string;
  submitUrl: string;
  requireSubmitterIdentity: boolean; // Whether this tournament requires submitter identification
}

export interface QRMatchResult {
  matchId: string;
  deviceToken?: string; // Optional: submitter's device token for audit trail
  player1_hits: number;
  player2_hits: number;
  winner: string;
}