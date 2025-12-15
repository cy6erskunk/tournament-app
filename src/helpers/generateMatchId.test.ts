import { describe, it, expect } from 'vitest';
import { generateMatchId, generateQRMatchData } from './generateMatchId';

describe('generateMatchId', () => {
  it('should generate a unique match ID', () => {
    const id1 = generateMatchId();
    const id2 = generateMatchId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should generate QR match data with correct structure', () => {
    const qrData = generateQRMatchData(
      'Player 1',
      'Player 2',
      1,
      2,
      'https://example.com',
      false
    );

    expect(qrData).toHaveProperty('matchId');
    expect(qrData).toHaveProperty('player1', 'Player 1');
    expect(qrData).toHaveProperty('player2', 'Player 2');
    expect(qrData).toHaveProperty('tournamentId', 1);
    expect(qrData).toHaveProperty('round', 2);
    expect(qrData).toHaveProperty('baseUri', 'https://example.com');
    expect(qrData).toHaveProperty('submitUrl', 'https://example.com/api/qr-match/submit');
    expect(qrData).toHaveProperty('requireSubmitterIdentity', false);
    expect(qrData.matchId).toMatch(/^[a-f0-9]{32}$/);
  });
});