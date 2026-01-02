import { describe, it, expect } from 'vitest';
import { QRMatchSubmissionSchema } from './qrMatchValidation';

describe('QRMatchSubmissionSchema', () => {
    const validBaseData = {
        matchId: 'match_123',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'Player1',
        player1: 'Player1',
        player2: 'Player2',
    };

    it('should validate a correct submission', () => {
        const result = QRMatchSubmissionSchema.safeParse(validBaseData);
        expect(result.success).toBe(true);
    });

    it('should validate a correct submission with deviceToken', () => {
        const data = { ...validBaseData, deviceToken: 'device_abc' };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('should fail if matchId is empty', () => {
        const data = { ...validBaseData, matchId: '' };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Match ID is required');
        }
    });

    it('should fail if player1_hits is NaN', () => {
        const data = { ...validBaseData, player1_hits: NaN };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Player 1 hits must be a number');
        }
    });

    it('should fail if player1_hits is Infinity', () => {
        const data = { ...validBaseData, player1_hits: Infinity };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Player 1 hits must be a number');
        }
    });

    it('should fail if player2_hits is NaN', () => {
        const data = { ...validBaseData, player2_hits: NaN };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Player 2 hits must be a number');
        }
    });


    it('should fail if player1_hits is negative', () => {
        const data = { ...validBaseData, player1_hits: -1 };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Player 1 hits cannot be negative');
        }
    });

    it('should fail if player2_hits is negative', () => {
        const data = { ...validBaseData, player2_hits: -1 };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Player 2 hits cannot be negative');
        }
    });

    it('should fail if player1_hits is not an integer', () => {
        const data = { ...validBaseData, player1_hits: 5.5 };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Player 1 hits must be an integer');
        }
    });

    it('should fail if player2_hits is not an integer', () => {
        const data = { ...validBaseData, player2_hits: 3.2 };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Player 2 hits must be an integer');
        }
    });

    it('should fail if winner is empty', () => {
        const data = { ...validBaseData, winner: '' };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            // The first error might be min(1)
            expect(result.error.issues.some(i => i.message === 'Winner is required')).toBe(true);
        }
    });

    it('should fail if winner matches neither player1 nor player2', () => {
        const data = { ...validBaseData, winner: 'RandomPerson' };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('Invalid winner');
        }
    });

    it('should validate if winner is player2', () => {
        const data = { ...validBaseData, winner: 'Player2' };
        const result = QRMatchSubmissionSchema.safeParse(data);
        expect(result.success).toBe(true);
    });
});
