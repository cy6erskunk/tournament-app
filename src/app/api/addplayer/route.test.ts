import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { getTournamentWithId } from "@/database/getTournament";
import { addPlayer } from "@/database/newPlayer";
import { getSession } from "@/helpers/getsession";

// Mock dependencies
vi.mock("@/database/getTournament", () => ({
  getTournamentWithId: vi.fn(),
}));

vi.mock("@/database/newPlayer", () => ({
  addPlayer: vi.fn(),
  newPlayer: vi.fn(),
}));

vi.mock("@/helpers/getsession", () => ({
  getSession: vi.fn(),
}));

describe("POST /api/addplayer - Admin Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    // Mock session to be invalid
    (getSession as any).mockResolvedValue({ success: false });

    const body = {
      name: "Test Player",
      tournamentId: 1,
    };

    const request = new Request("http://localhost/api/addplayer", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized access");
    expect(getTournamentWithId).not.toHaveBeenCalled();
    expect(addPlayer).not.toHaveBeenCalled();
  });

  it("should return 403 when authenticated user is not an admin", async () => {
    // Mock session with regular user role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "user", userId: 1 },
    });

    const body = {
      name: "Test Player",
      tournamentId: 1,
    };

    const request = new Request("http://localhost/api/addplayer", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Unauthorized access");
    expect(getTournamentWithId).not.toHaveBeenCalled();
    expect(addPlayer).not.toHaveBeenCalled();
  });

  it("should succeed when authenticated user is an admin", async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin", userId: 1 },
    });

    // Mock getTournamentWithId to return success
    (getTournamentWithId as any).mockResolvedValue({
      success: true,
      value: { id: 1, name: "Test Tournament" },
    });

    // Mock addPlayer to return success
    (addPlayer as any).mockResolvedValue({
      success: true,
      value: { name: "Test Player", tournamentId: 1 },
    });

    const body = {
      name: "Test Player",
      tournamentId: 1,
    };

    const request = new Request("http://localhost/api/addplayer", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(getTournamentWithId).toHaveBeenCalledWith(1);
    expect(addPlayer).toHaveBeenCalledWith("Test Player", 1, null, null, null);
  });

  it("should pass poolId to addPlayer when provided", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin", userId: 1 },
    });
    (getTournamentWithId as any).mockResolvedValue({
      success: true,
      value: { id: 1, name: "Test Tournament" },
    });
    (addPlayer as any).mockResolvedValue({
      success: true,
      value: { name: "Test Player", tournamentId: 1 },
    });

    const body = { name: "Test Player", tournamentId: 1, poolId: 3 };
    const request = new Request("http://localhost/api/addplayer", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(addPlayer).toHaveBeenCalledWith("Test Player", 1, null, null, 3);
  });

  it("should return 404 when tournament is not found (admin user)", async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin", userId: 1 },
    });

    // Mock getTournamentWithId to return failure
    (getTournamentWithId as any).mockResolvedValue({
      success: false,
      error: "Tournament not found",
    });

    const body = {
      name: "Test Player",
      tournamentId: 999,
    };

    const request = new Request("http://localhost/api/addplayer", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Tournament not found");
    expect(addPlayer).not.toHaveBeenCalled();
  });
});
