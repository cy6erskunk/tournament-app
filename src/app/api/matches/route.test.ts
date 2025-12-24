import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE, POST, PUT } from './route';
import { deleteMatch } from '@/database/deleteMatch';
import { addMatch } from '@/database/addMatch';
import { updateMatch } from '@/database/updateMatch';
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
        // Mock session to be valid with admin role
        (getSession as any).mockResolvedValue({ 
            success: true, 
            value: { name: 'admin', role: 'admin' } 
        });

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

    it('should reject non-admin users', async () => {
        // Mock session with non-admin role
        (getSession as any).mockResolvedValue({ 
            success: true, 
            value: { name: 'user', role: 'user' } 
        });

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
        
        expect(response.status).toBe(403);
        expect(deleteMatch).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated users', async () => {
        // Mock session failure
        (getSession as any).mockResolvedValue({ success: false, error: 'No token' });

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
        
        expect(response.status).toBe(403);
        expect(deleteMatch).not.toHaveBeenCalled();
    });
});

describe('POST /api/matches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject non-admin users', async () => {
        // Mock session with non-admin role
        (getSession as any).mockResolvedValue({ 
            success: true, 
            value: { name: 'user', role: 'user' } 
        });

        const body = {
            match: 1,
            player1: "TEST",
            player1_hits: 5,
            player2: "TEST2",
            player2_hits: 0,
            winner: "TEST",
            tournament_id: 2,
            round: 1
        };

        const request = new Request('http://localhost/api/matches', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const response = await POST(request);
        
        expect(response.status).toBe(403);
        expect(addMatch).not.toHaveBeenCalled();
    });

    it('should allow admin users to add matches', async () => {
        // Mock session with admin role
        (getSession as any).mockResolvedValue({ 
            success: true, 
            value: { name: 'admin', role: 'admin' } 
        });

        // Mock addMatch to return success
        (addMatch as any).mockResolvedValue({ success: true, value: { id: 1 } });

        const body = {
            match: 1,
            player1: "TEST",
            player1_hits: 5,
            player2: "TEST2",
            player2_hits: 0,
            winner: "TEST",
            tournament_id: 2,
            round: 1
        };

        const request = new Request('http://localhost/api/matches', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        const response = await POST(request);
        
        expect(response.status).toBe(200);
        expect(addMatch).toHaveBeenCalledWith(expect.objectContaining({
            match: 1,
            winner: "TEST"
        }));
    });
});

describe('PUT /api/matches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject non-admin users', async () => {
        // Mock session with non-admin role
        (getSession as any).mockResolvedValue({ 
            success: true, 
            value: { name: 'user', role: 'user' } 
        });

        const body = {
            match: 1,
            player1: "TEST",
            player1_hits: 5,
            player2: "TEST2",
            player2_hits: 3,
            winner: "TEST",
            tournament_id: 2,
            round: 1
        };

        const request = new Request('http://localhost/api/matches', {
            method: 'PUT',
            body: JSON.stringify(body),
        });

        const response = await PUT(request);
        
        expect(response.status).toBe(403);
        expect(updateMatch).not.toHaveBeenCalled();
    });

    it('should allow admin users to update matches', async () => {
        // Mock session with admin role
        (getSession as any).mockResolvedValue({ 
            success: true, 
            value: { name: 'admin', role: 'admin' } 
        });

        // Mock updateMatch to return success
        (updateMatch as any).mockResolvedValue({ success: true, value: { id: 1 } });

        const body = {
            match: 1,
            player1: "TEST",
            player1_hits: 5,
            player2: "TEST2",
            player2_hits: 3,
            winner: "TEST",
            tournament_id: 2,
            round: 1
        };

        const request = new Request('http://localhost/api/matches', {
            method: 'PUT',
            body: JSON.stringify(body),
        });

        const response = await PUT(request);
        
        expect(response.status).toBe(200);
        expect(updateMatch).toHaveBeenCalledWith(expect.objectContaining({
            match: 1,
            winner: "TEST"
        }));
    });
});

