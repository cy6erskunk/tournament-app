import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { addQRMatch } from '@/database/addQRMatch';
import { generateQRMatchData } from '@/helpers/generateMatchId';
import { getSession } from '@/helpers/getsession';
import { db } from '@/database/database';

// Mock dependencies
vi.mock('@/database/addQRMatch', () => ({
  addQRMatch: vi.fn(),
}));

vi.mock('@/helpers/generateMatchId', () => ({
  generateQRMatchData: vi.fn(),
}));

vi.mock('@/helpers/getsession', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/database/database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

describe('POST /api/qr-match/generate - Admin Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 403 when user is not authenticated', async () => {
    // Mock session to be invalid
    (getSession as any).mockResolvedValue({ success: false });

    const body = {
      player1: 'Player One',
      player2: 'Player Two',
      tournamentId: 1,
      round: 1,
      match: 1,
    };

    const request = new Request('http://localhost/api/qr-match/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Unauthorized access');
    expect(db.selectFrom).not.toHaveBeenCalled();
    expect(generateQRMatchData).not.toHaveBeenCalled();
    expect(addQRMatch).not.toHaveBeenCalled();
  });

  it('should return 403 when authenticated user is not an admin', async () => {
    // Mock session with regular user role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'user', userId: 1 },
    });

    const body = {
      player1: 'Player One',
      player2: 'Player Two',
      tournamentId: 1,
      round: 1,
      match: 1,
    };

    const request = new Request('http://localhost/api/qr-match/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Unauthorized access');
    expect(db.selectFrom).not.toHaveBeenCalled();
    expect(generateQRMatchData).not.toHaveBeenCalled();
    expect(addQRMatch).not.toHaveBeenCalled();
  });

  it('should succeed when authenticated user is an admin', async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'admin', userId: 1 },
    });

    // Mock database query chain
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

    // Mock QR match data generation
    const mockQRData = {
      matchId: 'test-match-id',
      player1: 'Player One',
      player2: 'Player Two',
      tournamentId: 1,
      round: 1,
      submitUrl: 'http://localhost:3000/api/qr-match/submit',
    };
    (generateQRMatchData as any).mockReturnValue(mockQRData);

    // Mock addQRMatch to return success
    (addQRMatch as any).mockResolvedValue({
      success: true,
      value: { match_id: 'test-match-id' },
    });

    const body = {
      player1: 'Player One',
      player2: 'Player Two',
      tournamentId: 1,
      round: 1,
      match: 1,
    };

    const request = new Request('http://localhost/api/qr-match/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(db.selectFrom).toHaveBeenCalledWith('tournaments');
    expect(generateQRMatchData).toHaveBeenCalledWith(
      'Player One',
      'Player Two',
      1,
      1,
      expect.any(String),
      false
    );
    expect(addQRMatch).toHaveBeenCalledWith({
      match_id: 'test-match-id',
      tournament_id: 1,
      player1: 'Player One',
      player2: 'Player Two',
      round: 1,
      match: 1,
    });
  });

  it('should return 404 when tournament is not found (admin user)', async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'admin', userId: 1 },
    });

    // Mock database query to return null (tournament not found)
    const mockExecuteTakeFirst = vi.fn().mockResolvedValue(null);
    const mockWhere = vi.fn().mockReturnValue({
      executeTakeFirst: mockExecuteTakeFirst,
    });
    const mockSelect = vi.fn().mockReturnValue({
      where: mockWhere,
    });
    (db.selectFrom as any).mockReturnValue({
      select: mockSelect,
    });

    const body = {
      player1: 'Player One',
      player2: 'Player Two',
      tournamentId: 999,
      round: 1,
      match: 1,
    };

    const request = new Request('http://localhost/api/qr-match/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Tournament not found');
    expect(generateQRMatchData).not.toHaveBeenCalled();
    expect(addQRMatch).not.toHaveBeenCalled();
  });

  it('should return 500 when storing match data fails (admin user)', async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'admin', userId: 1 },
    });

    // Mock database query chain
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

    // Mock QR match data generation
    const mockQRData = {
      matchId: 'test-match-id',
      player1: 'Player One',
      player2: 'Player Two',
      tournamentId: 1,
      round: 1,
      submitUrl: 'http://localhost:3000/api/qr-match/submit',
    };
    (generateQRMatchData as any).mockReturnValue(mockQRData);

    // Mock addQRMatch to return failure
    (addQRMatch as any).mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    const body = {
      player1: 'Player One',
      player2: 'Player Two',
      tournamentId: 1,
      round: 1,
      match: 1,
    };

    const request = new Request('http://localhost/api/qr-match/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Error storing match data: Database error');
  });
});
