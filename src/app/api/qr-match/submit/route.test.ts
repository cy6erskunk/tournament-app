import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database modules BEFORE importing the route
vi.mock('@/database/updateMatch', () => ({
  updateMatch: vi.fn(),
}));
vi.mock('@/database/addMatch', () => ({
  addMatch: vi.fn(),
}));
vi.mock('@/database/addQRMatch', () => ({
  getQRMatch: vi.fn(),
  removeQRMatch: vi.fn(),
}));
vi.mock('@/database/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));
vi.mock('@/helpers/validateSubmitter', () => ({
  validateSubmitter: vi.fn(),
}));

import { POST } from './route';
import { updateMatch } from '@/database/updateMatch';
import { getQRMatch } from '@/database/addQRMatch';
import { db } from '@/database/database';
import { validateSubmitter } from '@/helpers/validateSubmitter';

describe('POST /api/qr-match/submit - Input Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Zod Schema Validation', () => {
    beforeEach(() => {
      // Mock getQRMatch to return valid match data for validation tests
      vi.mocked(getQRMatch).mockResolvedValue({
        success: true,
        value: {
          match_id: 'test-match-123',
          created_at: new Date(),
          player1: 'Player One',
          player2: 'Player Two',
          tournament_id: 1,
          round: 1,
          match: 1,
        },
      });
    });

    it('should reject negative player1_hits', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: -5,
          player2_hits: 10,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      expect(responseText).toContain('Player 1 hits cannot be negative');
    });

    it('should reject negative player2_hits', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 10,
          player2_hits: -3,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      expect(responseText).toContain('Player 2 hits cannot be negative');
    });

    it('should reject non-integer hit counts', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 10.5,
          player2_hits: 8,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      expect(responseText).toContain('Player 1 hits must be an integer');
    });

    it('should reject NaN values for hit counts (converted to null in JSON)', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: NaN,
          player2_hits: 8,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      expect(responseText).toBe('Player 1 hits must be a number');
    });

    it('should reject Infinity values for hit counts (converted to null in JSON)', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 10,
          player2_hits: Infinity,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      expect(responseText).toBe('Player 2 hits must be a number');
    });

    it('should reject negative Infinity values for hit counts (converted to null in JSON)', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: -Infinity,
          player2_hits: 8,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      expect(responseText).toBe('Player 1 hits must be a number');
    });

    it('should reject missing matchId', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          player1_hits: 10,
          player2_hits: 8,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      // Validation catches missing matchId before database call
      expect(responseText).toContain('Invalid input');
    });

    it('should reject empty winner string', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 10,
          player2_hits: 8,
          winner: '',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      // Empty string fails Zod's .string() validation
      expect(responseText).toContain('winner');
    });

    it('should accept valid data with non-negative hits', async () => {
      vi.mocked(getQRMatch).mockResolvedValue({
        success: true,
        value: {
          match_id: 'test-match-123',
          created_at: new Date(),
          player1: 'Player One',
          player2: 'Player Two',
          tournament_id: 1,
          round: 1,
          match: 1,
        },
      });

      vi.mocked(db.selectFrom).mockReturnValue({
        select: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue({
              require_submitter_identity: false,
            }),
          }),
        }),
      } as any);

      vi.mocked(validateSubmitter).mockResolvedValue({
        success: true,
        submitterToken: null,
      });

      vi.mocked(updateMatch).mockResolvedValue({
        success: true,
        value: {
          id: 1,
          player1: 'Player One',
          player2: 'Player Two',
          tournament_id: 1,
          round: 1,
          match: 1,
          player1_hits: 0,
          player2_hits: 0,
          winner: 'Player One',
          submitted_by_token: null,
          submitted_at: new Date(),
        },
      });

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 0,
          player2_hits: 0,
          winner: 'Player One',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Winner Validation', () => {
    beforeEach(() => {
      vi.mocked(getQRMatch).mockResolvedValue({
        success: true,
        value: {
          match_id: 'test-match-123',
          created_at: new Date(),
          player1: 'Alice',
          player2: 'Bob',
          tournament_id: 1,
          round: 1,
          match: 1,
        },
      });
    });

    it('should reject winner that is not one of the players', async () => {
      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 10,
          player2_hits: 8,
          winner: 'Charlie',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(400);
      // Zod superRefine returns custom error message with player names
      expect(responseText).toContain('Invalid winner');
      expect(responseText).toContain('Charlie');
      expect(responseText).toContain('Alice');
      expect(responseText).toContain('Bob');
    });

    it('should accept winner matching player1', async () => {
      vi.mocked(db.selectFrom).mockReturnValue({
        select: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue({
              require_submitter_identity: false,
            }),
          }),
        }),
      } as any);

      vi.mocked(validateSubmitter).mockResolvedValue({
        success: true,
        submitterToken: null,
      });

      vi.mocked(updateMatch).mockResolvedValue({
        success: true,
        value: {
          id: 1,
          player1: 'Alice',
          player2: 'Bob',
          tournament_id: 1,
          round: 1,
          match: 1,
          player1_hits: 15,
          player2_hits: 8,
          winner: 'Alice',
          submitted_by_token: null,
          submitted_at: new Date(),
        },
      });

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 15,
          player2_hits: 8,
          winner: 'Alice',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('should accept winner matching player2', async () => {
      vi.mocked(db.selectFrom).mockReturnValue({
        select: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue({
              require_submitter_identity: false,
            }),
          }),
        }),
      } as any);

      vi.mocked(validateSubmitter).mockResolvedValue({
        success: true,
        submitterToken: null,
      });

      vi.mocked(updateMatch).mockResolvedValue({
        success: true,
        value: {
          id: 1,
          player1: 'Alice',
          player2: 'Bob',
          tournament_id: 1,
          round: 1,
          match: 1,
          player1_hits: 8,
          player2_hits: 15,
          winner: 'Bob',
          submitted_by_token: null,
          submitted_at: new Date(),
        },
      });

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 8,
          player2_hits: 15,
          winner: 'Bob',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Submitter Validation', () => {
    it('should return 401 when validateSubmitter fails', async () => {
      // Import the actual validateSubmitter implementation
      const { validateSubmitter: realValidateSubmitter } = await vi.importActual<typeof import('@/helpers/validateSubmitter')>('@/helpers/validateSubmitter');

      // Use the real implementation for this test
      vi.mocked(validateSubmitter).mockImplementation(realValidateSubmitter);

      // Mock getQRMatch to return valid match data
      vi.mocked(getQRMatch).mockResolvedValue({
        success: true,
        value: {
          match_id: 'test-match-123',
          created_at: new Date(),
          player1: 'Alice',
          player2: 'Bob',
          tournament_id: 1,
          round: 1,
          match: 1,
        },
      });

      // Mock db to handle both tournament and device lookups
      vi.mocked(db.selectFrom).mockImplementation((table: any) => {
        if (table === 'tournaments') {
          return {
            select: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                executeTakeFirst: vi.fn().mockResolvedValue({
                  require_submitter_identity: true,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'submitter_devices') {
          return {
            select: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                executeTakeFirst: vi.fn().mockResolvedValue(undefined), // Simulating device not found
              }),
            }),
          } as any;
        }
        return {
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        } as any;
      });

      const request = new Request('http://localhost/api/qr-match/submit', {
        method: 'POST',
        body: JSON.stringify({
          matchId: 'test-match-123',
          player1_hits: 10,
          player2_hits: 8,
          winner: 'Alice',
          deviceToken: 'invalid-token',
        }),
      });

      const response = await POST(request);
      const responseText = await response.text();

      expect(response.status).toBe(401);
      expect(responseText).toBe('Invalid device token');
    });
  });
});
