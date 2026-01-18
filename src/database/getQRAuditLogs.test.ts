import { describe, it, expect, beforeEach, vi } from "vitest";
import { getQRAuditLogs } from "./getQRAuditLogs";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

describe("getQRAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all QR audit logs with proper joins and ordering", async () => {
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

    const selectFromMock = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue(mockLogs),
              }),
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getQRAuditLogs();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(2);
      expect(result.value).toEqual(mockLogs);
      expect(result.value[0].tournament_name).toBe("Summer Championship");
      expect(result.value[0].submitter_name).toBe("Tablet 1");
    }

    expect(selectFromMock).toHaveBeenCalledWith("matches");
  });

  it("should return logs with null submitter_name for unregistered devices", async () => {
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

    const selectFromMock = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue(mockLogs),
              }),
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getQRAuditLogs();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value[0].submitter_name).toBeNull();
      expect(result.value[0].submitted_by_token).toBe("DEVICE_unregistered");
    }
  });

  it("should return empty array when no QR submissions exist", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getQRAuditLogs();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual([]);
    }
  });

  it("should handle database errors gracefully", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                execute: vi.fn().mockRejectedValue(new Error("Database error")),
              }),
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getQRAuditLogs();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error fetching QR audit logs");
    }
  });

  it("should return logs ordered by submitted_at descending", async () => {
    const mockLogs = [
      {
        id: 3,
        tournament_id: 1,
        tournament_name: "Tournament A",
        match_number: 1,
        round: 1,
        player1: "Player 1",
        player2: "Player 2",
        player1_hits: 5,
        player2_hits: 3,
        winner: "Player 1",
        submitted_by_token: "DEVICE_token",
        submitter_name: "Device 1",
        submitted_at: new Date("2024-01-06T12:00:00Z"),
      },
      {
        id: 2,
        tournament_id: 1,
        tournament_name: "Tournament A",
        match_number: 2,
        round: 1,
        player1: "Player 3",
        player2: "Player 4",
        player1_hits: 4,
        player2_hits: 5,
        winner: "Player 4",
        submitted_by_token: "DEVICE_token",
        submitter_name: "Device 1",
        submitted_at: new Date("2024-01-05T12:00:00Z"),
      },
      {
        id: 1,
        tournament_id: 1,
        tournament_name: "Tournament A",
        match_number: 3,
        round: 1,
        player1: "Player 5",
        player2: "Player 6",
        player1_hits: 5,
        player2_hits: 5,
        winner: "Player 5",
        submitted_by_token: "DEVICE_token",
        submitter_name: "Device 1",
        submitted_at: new Date("2024-01-04T12:00:00Z"),
      },
    ];

    const selectFromMock = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue(mockLogs),
              }),
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getQRAuditLogs();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(3);
      // Verify ordering (most recent first)
      expect(result.value[0].submitted_at).toEqual(
        new Date("2024-01-06T12:00:00Z")
      );
      expect(result.value[1].submitted_at).toEqual(
        new Date("2024-01-05T12:00:00Z")
      );
      expect(result.value[2].submitted_at).toEqual(
        new Date("2024-01-04T12:00:00Z")
      );
    }
  });

  it("should return all match details including hits and winner", async () => {
    const mockLogs = [
      {
        id: 1,
        tournament_id: 5,
        tournament_name: "Test Tournament",
        match_number: 10,
        round: 3,
        player1: "John Doe",
        player2: "Jane Smith",
        player1_hits: 7,
        player2_hits: 4,
        winner: "John Doe",
        submitted_by_token: "DEVICE_test",
        submitter_name: "Test Device",
        submitted_at: new Date("2024-01-01T10:00:00Z"),
      },
    ];

    const selectFromMock = vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                execute: vi.fn().mockResolvedValue(mockLogs),
              }),
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getQRAuditLogs();

    expect(result.success).toBe(true);
    if (result.success) {
      const log = result.value[0];
      expect(log.id).toBe(1);
      expect(log.tournament_id).toBe(5);
      expect(log.tournament_name).toBe("Test Tournament");
      expect(log.match_number).toBe(10);
      expect(log.round).toBe(3);
      expect(log.player1).toBe("John Doe");
      expect(log.player2).toBe("Jane Smith");
      expect(log.player1_hits).toBe(7);
      expect(log.player2_hits).toBe(4);
      expect(log.winner).toBe("John Doe");
      expect(log.submitted_by_token).toBe("DEVICE_test");
      expect(log.submitter_name).toBe("Test Device");
    }
  });
});
