import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getQRMatch, removeQRMatch } from '@/database/addQRMatch';
import { updateMatch } from '@/database/updateMatch';
import { addMatch } from '@/database/addMatch';
import { validateSubmitter } from '@/helpers/validateSubmitter';
import { db } from '@/database/database';

// Mock dependencies
vi.mock('@/database/addQRMatch', () => ({
  getQRMatch: vi.fn(),
  removeQRMatch: vi.fn(),
}));

vi.mock('@/database/updateMatch', () => ({
  updateMatch: vi.fn(),
}));

vi.mock('@/database/addMatch', () => ({
  addMatch: vi.fn(),
}));

vi.mock('@/helpers/validateSubmitter', () => ({
  validateSubmitter: vi.fn(),
}));

vi.mock('@/database/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

describe('POST /api/qr-match/submit - Input Validation', () => {
  const validMatchData = {
    match_id: 'abc123xyz789',
    tournament_id: 1,
    player1: 'John Smith',
    player2: 'Jane Doe',
    round: 1,
    match: 1,
    created_at: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for getQRMatch - returns valid match data
    (getQRMatch as any).mockResolvedValue({
      success: true,
      value: validMatchData,
    });

    // Default mock for tournament query
    const mockExecuteTakeFirst = vi.fn().mockResolvedValue({
      require_submitter_identity: false,
    });
    const mockWhere = vi.fn().mockReturnValue({
      executeTakeFirst: mockExecuteTakeFirst,
    });
    const mockSelect = vi.fn().mockReturnValue({
      where: mockWhere,
    });
    (db.selectFrom as any).mockReturnValue({
      select: mockSelect,
    });

    // Default mock for validateSubmitter
    (validateSubmitter as any).mockResolvedValue({
      success: true,
      submitterToken: null,
    });

    // Default mock for updateMatch (success)
    (updateMatch as any).mockResolvedValue({
      success: true,
      value: {
        id: 1,
        player1: 'John Smith',
        player2: 'Jane Doe',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'John Smith',
        round: 1,
        tournament_id: 1,
        match: 1,
        submitted_at: new Date(),
        submitted_by_token: null,
      },
    });

    // Default mock for removeQRMatch
    (removeQRMatch as any).mockResolvedValue(undefined);
  });

  describe('Negative hit count validation', () => {
    it('should reject negative player1_hits', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: -1,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toContain('Invalid match result');
      expect(text).toContain('player1_hits');
      expect(text).toContain('negative');
      expect(updateMatch).not.toHaveBeenCalled();
      expect(addMatch).not.toHaveBeenCalled();
    });

    it('should reject negative player2_hits', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: -3,
        winner: 'Jane Doe',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toContain('Invalid match result');
      expect(text).toContain('player2_hits');
      expect(text).toContain('negative');
      expect(updateMatch).not.toHaveBeenCalled();
      expect(addMatch).not.toHaveBeenCalled();
    });
  });

  describe('Invalid winner validation', () => {
    it('should reject winner that does not match player names', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'Wrong Player',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toContain('Invalid match result');
      expect(text).toContain('Invalid winner');
      expect(updateMatch).not.toHaveBeenCalled();
      expect(addMatch).not.toHaveBeenCalled();
    });

    it('should reject empty winner', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: '',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toContain('Invalid match result');
      expect(text).toContain('Invalid winner');
      expect(updateMatch).not.toHaveBeenCalled();
      expect(addMatch).not.toHaveBeenCalled();
    });
  });

  describe('Data type validation', () => {
    it('should reject non-integer player1_hits (float)', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: 5.5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toContain('Invalid match result');
      expect(text).toContain('player1_hits');
      expect(text).toContain('integer');
      expect(updateMatch).not.toHaveBeenCalled();
      expect(addMatch).not.toHaveBeenCalled();
    });

    it('should reject string player1_hits', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: '5',
        player2_hits: 3,
        winner: 'John Smith',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toContain('Invalid match result');
      expect(text).toContain('player1_hits');
      expect(text).toContain('number');
      expect(updateMatch).not.toHaveBeenCalled();
      expect(addMatch).not.toHaveBeenCalled();
    });

    it('should reject non-string winner', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: 123,
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);
      const text = await response.text();

      expect(response.status).toBe(400);
      expect(text).toContain('Invalid match result');
      expect(text).toContain('winner');
      expect(updateMatch).not.toHaveBeenCalled();
      expect(addMatch).not.toHaveBeenCalled();
    });
  });

  describe('Valid submission', () => {
    it('should accept valid match result', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          player1_hits: 5,
          player2_hits: 3,
          winner: 'John Smith',
        })
      );
    });

    it('should accept zero hit counts', async () => {
      const body = {
        matchId: 'abc123xyz789',
        player1_hits: 0,
        player2_hits: 0,
        winner: 'Jane Doe',
      };

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(updateMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          player1_hits: 0,
          player2_hits: 0,
          winner: 'Jane Doe',
        })
      );
    });
  });
});
