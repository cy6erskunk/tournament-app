import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { assignPlayerToPool, getPools } from "@/database/getPools";
import { getSession } from "@/helpers/getsession";

vi.mock("@/database/getPools", () => ({
  assignPlayerToPool: vi.fn(),
  getPools: vi.fn(),
}));

vi.mock("@/helpers/getsession", () => ({
  getSession: vi.fn(),
}));

const makeRequest = (method: string, body?: object) => {
  return new Request(`http://localhost/api/tournament/1/pools/2/players`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
};

const makeParams = (tournamentId: string = "1", poolId: string = "2") =>
  Promise.resolve({ tournamentId, poolId });

describe("POST /api/tournament/[tournamentId]/pools/[poolId]/players", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should assign a player to a pool when admin is authenticated", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });
    (getPools as any).mockResolvedValue({
      success: true,
      value: [{ id: 2, tournament_id: 1, name: "Pool A" }],
    });
    (assignPlayerToPool as any).mockResolvedValue({
      success: true,
      value: undefined,
    });

    const response = await POST(makeRequest("POST", { playerName: "Alice" }), {
      params: makeParams("1", "2"),
    });

    expect(response.status).toBe(200);
    expect(assignPlayerToPool).toHaveBeenCalledWith("Alice", 1, 2);
  });

  it("should return 404 when pool does not belong to tournament", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });
    (getPools as any).mockResolvedValue({
      success: true,
      value: [{ id: 99, tournament_id: 1, name: "Pool B" }],
    });

    const response = await POST(makeRequest("POST", { playerName: "Alice" }), {
      params: makeParams("1", "2"),
    });

    expect(response.status).toBe(404);
    expect(assignPlayerToPool).not.toHaveBeenCalled();
  });

  it("should return 403 when user is not admin", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "user" },
    });

    const response = await POST(makeRequest("POST", { playerName: "Alice" }), {
      params: makeParams("1", "2"),
    });

    expect(response.status).toBe(403);
    expect(assignPlayerToPool).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue({ success: false });

    const response = await POST(makeRequest("POST", { playerName: "Alice" }), {
      params: makeParams("1", "2"),
    });

    expect(response.status).toBe(401);
    expect(assignPlayerToPool).not.toHaveBeenCalled();
  });

  it("should return 400 when player name is missing", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });

    const response = await POST(makeRequest("POST", {}), {
      params: makeParams("1", "2"),
    });

    expect(response.status).toBe(400);
    expect(assignPlayerToPool).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid pool ID", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });

    const response = await POST(makeRequest("POST", { playerName: "Alice" }), {
      params: makeParams("1", "invalid"),
    });

    expect(response.status).toBe(400);
    expect(assignPlayerToPool).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid tournament ID", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });

    const response = await POST(makeRequest("POST", { playerName: "Alice" }), {
      params: makeParams("invalid", "2"),
    });

    expect(response.status).toBe(400);
    expect(assignPlayerToPool).not.toHaveBeenCalled();
  });

  it("should return 500 when assignment fails", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });
    (getPools as any).mockResolvedValue({
      success: true,
      value: [{ id: 2, tournament_id: 1, name: "Pool A" }],
    });
    (assignPlayerToPool as any).mockResolvedValue({
      success: false,
      error: "Could not assign player to pool",
    });

    const response = await POST(makeRequest("POST", { playerName: "Alice" }), {
      params: makeParams("1", "2"),
    });

    expect(response.status).toBe(500);
  });
});
