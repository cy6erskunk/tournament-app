import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "./route";
import { getPools, createPool, deletePool } from "@/database/getPools";
import { getSession } from "@/helpers/getsession";

vi.mock("@/database/getPools", () => ({
  getPools: vi.fn(),
  createPool: vi.fn(),
  deletePool: vi.fn(),
}));

vi.mock("@/helpers/getsession", () => ({
  getSession: vi.fn(),
}));

const makeRequest = (
  method: string,
  body?: object,
  params?: Record<string, string>,
) => {
  const request = new Request(`http://localhost/api/tournament/1/pools`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });
  return request;
};

const makeParams = (tournamentId: string = "1") =>
  Promise.resolve({ tournamentId });

describe("GET /api/tournament/[tournamentId]/pools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return pools for a tournament", async () => {
    const mockPools = [
      { id: 1, tournament_id: 1, name: "Pool A" },
      { id: 2, tournament_id: 1, name: "Pool B" },
    ];
    (getPools as any).mockResolvedValue({ success: true, value: mockPools });

    const response = await GET(makeRequest("GET"), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Pool A");
  });

  it("should return empty array when no pools exist", async () => {
    (getPools as any).mockResolvedValue({ success: true, value: [] });

    const response = await GET(makeRequest("GET"), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(0);
  });

  it("should return 500 when database error occurs", async () => {
    (getPools as any).mockResolvedValue({
      success: false,
      error: "Could not fetch pools",
    });

    const response = await GET(makeRequest("GET"), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(500);
  });

  it("should return 400 for invalid tournament ID", async () => {
    const response = await GET(makeRequest("GET"), {
      params: makeParams("invalid"),
    });

    expect(response.status).toBe(400);
  });
});

describe("POST /api/tournament/[tournamentId]/pools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a pool when admin is authenticated", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });
    (createPool as any).mockResolvedValue({
      success: true,
      value: { id: 1, tournament_id: 1, name: "Pool A" },
    });

    const response = await POST(makeRequest("POST", { name: "Pool A" }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Pool A");
    expect(createPool).toHaveBeenCalledWith(1, "Pool A");
  });

  it("should return 403 when user is not admin", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "user" },
    });

    const response = await POST(makeRequest("POST", { name: "Pool A" }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(403);
    expect(createPool).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue({ success: false });

    const response = await POST(makeRequest("POST", { name: "Pool A" }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(401);
    expect(createPool).not.toHaveBeenCalled();
  });

  it("should return 400 when pool name is missing", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });

    const response = await POST(makeRequest("POST", {}), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(400);
    expect(createPool).not.toHaveBeenCalled();
  });

  it("should return 400 for invalid tournament ID", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });

    const response = await POST(makeRequest("POST", { name: "Pool A" }), {
      params: makeParams("invalid"),
    });

    expect(response.status).toBe(400);
    expect(createPool).not.toHaveBeenCalled();
  });

  it("should return 500 when pool creation fails", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });
    (createPool as any).mockResolvedValue({
      success: false,
      error: "Could not create pool",
    });

    const response = await POST(makeRequest("POST", { name: "Pool A" }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(500);
  });
});

describe("DELETE /api/tournament/[tournamentId]/pools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a pool when admin is authenticated", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });
    (deletePool as any).mockResolvedValue({ success: true, value: undefined });

    const response = await DELETE(makeRequest("DELETE", { poolId: 1 }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(200);
    expect(deletePool).toHaveBeenCalledWith(1);
  });

  it("should return 403 when user is not admin", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "user" },
    });

    const response = await DELETE(makeRequest("DELETE", { poolId: 1 }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(403);
    expect(deletePool).not.toHaveBeenCalled();
  });

  it("should return 401 when user is not authenticated", async () => {
    (getSession as any).mockResolvedValue({ success: false });

    const response = await DELETE(makeRequest("DELETE", { poolId: 1 }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(401);
    expect(deletePool).not.toHaveBeenCalled();
  });

  it("should return 400 when pool ID is missing", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });

    const response = await DELETE(makeRequest("DELETE", {}), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(400);
    expect(deletePool).not.toHaveBeenCalled();
  });

  it("should return 500 when deletion fails", async () => {
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin" },
    });
    (deletePool as any).mockResolvedValue({
      success: false,
      error: "Could not delete pool",
    });

    const response = await DELETE(makeRequest("DELETE", { poolId: 1 }), {
      params: makeParams("1"),
    });

    expect(response.status).toBe(500);
  });
});
