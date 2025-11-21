export interface QRMatchData {
  matchId: string;
  secret: string; // Cryptographic token for authenticating submissions
  player1: string;
  player2: string;
  tournamentId: number;
  round: number;
  submitUrl: string;
}

export interface QRMatchResult {
  matchId: string;
  secret: string; // Required to authenticate the submission
  player1_hits: number;
  player2_hits: number;
  winner: string;
}