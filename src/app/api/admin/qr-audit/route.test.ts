import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getSession } from "@/helpers/getsession";
import { getQRAuditLogs } from "@/database/getQRAuditLogs";

// Mock dependencies
vi.mock("@/helpers/getsession", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/database/getQRAuditLogs", () => ({
  getQRAuditLogs: vi.fn(),
}));

describe("GET /api/admin/qr-audit - Admin Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    // Mock session to be invalid
    (getSession as any).mockResolvedValue({ success: false });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(getQRAuditLogs).not.toHaveBeenCalled();
  });

  it("should return 401 when authenticated user is not an admin", async () => {
    // Mock session with regular user role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "user", userId: 1 },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(getQRAuditLogs).not.toHaveBeenCalled();
  });

  it("should return QR audit logs when authenticated user is an admin", async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin", userId: 1 },
    });

    const mockLogs = [
      {
        id: 1,
        tournament_id: 1,
        tournament_name: "Summer Championship",
        match_number: 5,
        round: 2,
        player1: "Alice Smith",
        player2: "Bob Jones",
        player1_hits: 5,
        player2_hits: 3,
        winner: "Alice Smith",
        submitted_by_token: "DEVICE_abc123",
        submitter_name: "Tablet 1",
        submitted_at: new Date("2024-01-05T10:30:00Z"),
      },
      {
        id: 2,
        tournament_id: 2,
        tournament_name: "Winter Open",
        match_number: 3,
        round: 1,
        player1: "Charlie Brown",
        player2: "Diana Prince",
        player1_hits: 4,
        player2_hits: 5,
        winner: "Diana Prince",
        submitted_by_token: "DEVICE_xyz789",
        submitter_name: "Phone Scanner",
        submitted_at: new Date("2024-01-04T15:20:00Z"),
      },
    ];

    // Mock getQRAuditLogs to return success
    (getQRAuditLogs as any).mockResolvedValue({
      success: true,
      value: mockLogs,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe(1);
    expect(data[0].tournament_name).toBe("Summer Championship");
    expect(data[0].player1).toBe("Alice Smith");
    expect(data[0].player2).toBe("Bob Jones");
    expect(data[0].winner).toBe("Alice Smith");
    expect(data[0].submitted_by_token).toBe("DEVICE_abc123");
    expect(data[0].submitter_name).toBe("Tablet 1");
    expect(data[0].submitted_at).toBe("2024-01-05T10:30:00.000Z");
    expect(data[1].id).toBe(2);
    expect(data[1].tournament_name).toBe("Winter Open");
    expect(getQRAuditLogs).toHaveBeenCalledOnce();
  });

  it("should return empty array when no QR submissions exist", async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin", userId: 1 },
    });

    // Mock getQRAuditLogs to return empty array
    (getQRAuditLogs as any).mockResolvedValue({
      success: true,
      value: [],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(getQRAuditLogs).toHaveBeenCalledOnce();
  });

  it("should return 500 when database error occurs", async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin", userId: 1 },
    });

    // Mock getQRAuditLogs to return error
    (getQRAuditLogs as any).mockResolvedValue({
      success: false,
      error: "Error fetching QR audit logs",
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Error fetching QR audit logs" });
    expect(getQRAuditLogs).toHaveBeenCalledOnce();
  });

  it("should handle logs with null submitter_name", async () => {
    // Mock session with admin role
    (getSession as any).mockResolvedValue({
      success: true,
      value: { role: "admin", userId: 1 },
    });

    const mockLogs = [
      {
        id: 3,
        tournament_id: 1,
        tournament_name: "Fall Tournament",
        match_number: 2,
        round: 1,
        player1: "Eve Adams",
        player2: "Frank Miller",
        player1_hits: 5,
        player2_hits: 2,
        winner: "Eve Adams",
        submitted_by_token: "DEVICE_unregistered",
        submitter_name: null,
        submitted_at: new Date("2024-01-03T09:15:00Z"),
      },
    ];

    // Mock getQRAuditLogs to return logs with null submitter_name
    (getQRAuditLogs as any).mockResolvedValue({
      success: true,
      value: mockLogs,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(3);
    expect(data[0].tournament_name).toBe("Fall Tournament");
    expect(data[0].submitter_name).toBeNull();
    expect(data[0].submitted_by_token).toBe("DEVICE_unregistered");
    expect(data[0].submitted_at).toBe("2024-01-03T09:15:00.000Z");
    expect(getQRAuditLogs).toHaveBeenCalledOnce();
  });
});
