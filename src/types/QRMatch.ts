export interface QRMatchData {
  matchId: string;
  player1: string;
  player2: string;
  tournamentId: number;
  round: number;
  submitUrl: string;
}

export interface QRMatchResult {
  matchId: string;
  player1_hits: number;
  player2_hits: number;
  winner: string;
}