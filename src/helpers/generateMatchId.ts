import { randomBytes } from 'crypto';

export function generateMatchId(): string {
  return randomBytes(16).toString('hex');
}

export function generateQRMatchData(
  player1: string,
  player2: string,
  tournamentId: number,
  round: number,
  baseUrl: string
) {
  const matchId = generateMatchId();
  const submitUrl = `${baseUrl}/api/qr-match/submit`;
  
  return {
    matchId,
    player1,
    player2,
    tournamentId,
    round,
    submitUrl
  };
}