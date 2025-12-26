import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getTournamentWithId } from '@/database/getTournament';
import { newPlayer, addPlayer } from '@/database/newPlayer';
import { getSession } from '@/helpers/getsession';

// Mock dependencies
vi.mock('@/database/getTournament', () => ({
  getTournamentWithId: vi.fn(),
}));

vi.mock('@/database/newPlayer', () => ({
  newPlayer: vi.fn(),
  addPlayer: vi.fn(),
}));

vi.mock('@/helpers/getsession', () => ({
  getSession: vi.fn(),
}));

describe('POST /api/newplayer - Admin Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    // Mock session to be invalid
    (getSession as any).mockResolvedValue({ success: false });

    const body = {
      name: 'New Player',
      tournamentId: 1,
    };

    const request = new Request('http://localhost/api/newplayer', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(getTournamentWithId).not.toHaveBeenCalled();
    expect(newPlayer).not.toHaveBeenCalled();
    expect(addPlayer).not.toHaveBeenCalled();
  });

  it('should return 403 when authenticated user is not an admin', async () => {
    // Mock session with regular user role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'user', userId: 1 },
    });

    const body = {
      name: 'New Player',
      tournamentId: 1,
    };

    const request = new Request('http://localhost/api/newplayer', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe('Unauthorized access');
    expect(getTournamentWithId).not.toHaveBeenCalled();
    expect(newPlayer).not.toHaveBeenCalled();
    expect(addPlayer).not.toHaveBeenCalled();
  });

  it('should succeed when authenticated user is an admin', async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'admin', userId: 1 },
    });

    // Mock getTournamentWithId to return success
    (getTournamentWithId as any).mockResolvedValue({
      success: true,
      value: { id: 1, name: 'Test Tournament' },
    });

    // Mock newPlayer to return success
    (newPlayer as any).mockResolvedValue({
      success: true,
      value: { id: 1, name: 'New Player' },
    });

    // Mock addPlayer to return success
    (addPlayer as any).mockResolvedValue({
      success: true,
      value: { name: 'New Player', tournamentId: 1 },
    });

    const body = {
      name: 'New Player',
      tournamentId: 1,
    };

    const request = new Request('http://localhost/api/newplayer', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(getTournamentWithId).toHaveBeenCalledWith(1);
    expect(newPlayer).toHaveBeenCalledWith('New Player');
    expect(addPlayer).toHaveBeenCalledWith('New Player', 1);
  });

  it('should return 400 when tournament is not found (admin user)', async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'admin', userId: 1 },
    });

    // Mock getTournamentWithId to return failure
    (getTournamentWithId as any).mockResolvedValue({
      success: false,
      error: 'Tournament not found',
    });

    const body = {
      name: 'New Player',
      tournamentId: 999,
    };

    const request = new Request('http://localhost/api/newplayer', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Tournament not found');
    expect(newPlayer).not.toHaveBeenCalled();
    expect(addPlayer).not.toHaveBeenCalled();
  });

  it('should return 400 when player creation fails (admin user)', async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: 'admin', userId: 1 },
    });

    // Mock getTournamentWithId to return success
    (getTournamentWithId as any).mockResolvedValue({
      success: true,
      value: { id: 1, name: 'Test Tournament' },
    });

    // Mock newPlayer to return failure
    (newPlayer as any).mockResolvedValue({
      success: false,
      error: 'Player already exists',
    });

    const body = {
      name: 'Existing Player',
      tournamentId: 1,
    };

    const request = new Request('http://localhost/api/newplayer', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Error adding player to players table');
    expect(addPlayer).not.toHaveBeenCalled();
  });
});
