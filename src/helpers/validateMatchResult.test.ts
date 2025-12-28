import { describe, it, expect } from 'vitest';
import { validateMatchResult } from './validateMatchResult';

describe('validateMatchResult', () => {
  const context = {
    player1: 'John Smith',
    player2: 'Jane Doe',
  };

  describe('Valid inputs', () => {
    it('should accept valid match result without deviceToken', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(data);
      }
    });

    it('should accept valid match result with deviceToken', () => {
      const data = {
        matchId: 'abc123xyz789',
        deviceToken: 'device-token-123',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(data);
      }
    });

    it('should accept zero hit counts', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 0,
        player2_hits: 0,
        winner: 'Jane Doe',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(data);
      }
    });

    it('should accept second player as winner', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 2,
        player2_hits: 5,
        winner: 'Jane Doe',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.winner).toBe('Jane Doe');
      }
    });
  });

  describe('Invalid data types', () => {
    it('should reject null data', () => {
      const result = validateMatchResult(null, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be an object');
      }
    });

    it('should reject non-object data', () => {
      const result = validateMatchResult('not an object', context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be an object');
      }
    });

    it('should reject array data', () => {
      const result = validateMatchResult([], context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('must be an object');
      }
    });
  });

  describe('Missing required fields', () => {
    it('should reject missing matchId', () => {
      const data = {
        player1_hits: 5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('matchId');
      }
    });

    it('should reject missing player1_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player1_hits');
      }
    });

    it('should reject missing player2_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player2_hits');
      }
    });

    it('should reject missing winner', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('winner');
      }
    });
  });

  describe('Invalid field types', () => {
    it('should reject non-string matchId', () => {
      const data = {
        matchId: 123,
        player1_hits: 5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('matchId');
      }
    });

    it('should reject non-string winner', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: 123,
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('winner');
      }
    });

    it('should reject string player1_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: '5',
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player1_hits');
        expect(result.error).toContain('number');
      }
    });

    it('should reject string player2_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: '3',
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player2_hits');
        expect(result.error).toContain('number');
      }
    });

    it('should reject non-string deviceToken', () => {
      const data = {
        matchId: 'abc123xyz789',
        deviceToken: 123,
        player1_hits: 5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('deviceToken');
      }
    });
  });

  describe('Invalid hit counts', () => {
    it('should reject negative player1_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: -1,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player1_hits');
        expect(result.error).toContain('negative');
      }
    });

    it('should reject negative player2_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: -3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player2_hits');
        expect(result.error).toContain('negative');
      }
    });

    it('should reject float player1_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5.5,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player1_hits');
        expect(result.error).toContain('integer');
      }
    });

    it('should reject float player2_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3.7,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player2_hits');
        expect(result.error).toContain('integer');
      }
    });

    it('should reject NaN player1_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: NaN,
        player2_hits: 3,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player1_hits');
      }
    });

    it('should reject Infinity player2_hits', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: Infinity,
        winner: 'John Smith',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('player2_hits');
      }
    });
  });

  describe('Invalid winner', () => {
    it('should reject winner that does not match player1 or player2', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'Wrong Player',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid winner');
        expect(result.error).toContain('John Smith');
        expect(result.error).toContain('Jane Doe');
      }
    });

    it('should reject winner with incorrect casing', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'john smith', // lowercase
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid winner');
      }
    });

    it('should reject empty string winner', () => {
      const data = {
        matchId: 'abc123xyz789',
        player1_hits: 5,
        player2_hits: 3,
        winner: '',
      };

      const result = validateMatchResult(data, context);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid winner');
      }
    });
  });
});
