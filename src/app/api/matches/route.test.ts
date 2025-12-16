import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './route';
import { deleteMatch } from '@/database/deleteMatch';
import { getSession } from '@/helpers/getsession';

// Mock dependencies
vi.mock('@/database/deleteMatch', () => ({
    deleteMatch: vi.fn(),
}));
vi.mock('@/database/addMatch', () => ({
    addMatch: vi.fn(),
}));
vi.mock('@/database/updateMatch', () => ({
    updateMatch: vi.fn(),
}));

vi.mock('@/helpers/getsession', () => ({
    getSession: vi.fn(),
}));

describe('DELETE /api/matches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should succeed when deleting a match even if winner is null (Fix for Bug #44)', async () => {
        // Mock session to be valid
        (getSession as any).mockResolvedValue({ success: true });

        // Mock deleteMatch to return success
        (deleteMatch as any).mockResolvedValue({ success: true, value: 1 });

        const body = {
            match: 1,
            player1: "TEST",
            player1_hits: 0,
            player2: "TEST2",
            player2_hits: 5,
            winner: null,
            tournament_id: 2,
            round: 1
        };

        const request = new Request('http://localhost/api/matches', {
            method: 'DELETE',
            body: JSON.stringify(body),
        });

        const response = await DELETE(request);
        const text = await response.text();

        expect(response.status).toBe(200);
        expect(text).toBe("1");
        expect(deleteMatch).toHaveBeenCalledWith(expect.objectContaining({
            match: 1,
            tournament_id: 2,
            round: 1
        }));
    });
});
