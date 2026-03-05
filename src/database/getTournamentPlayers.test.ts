import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTournamentPlayers } from "./getTournamentPlayers";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

const makeSelectMock = (rows: unknown[]) =>
  vi.fn().mockReturnValue({
    selectAll: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });

describe("getTournamentPlayers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with empty array when tournament has no players", async () => {
    // First call: tournament_players returns []
    // Second call: matches — should not be reached, but guard against it
    (db.selectFrom as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

    const result = await getTournamentPlayers(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual([]);
    }
  });

  it("returns success with players and their matches", async () => {
    const mockTournamentPlayers = [
      { player_name: "Alice", tournament_id: 1, pool_id: null },
      { player_name: "Bob", tournament_id: 1, pool_id: null },
    ];
    const mockMatches = [
      { player1: "Alice", player2: "Bob", tournament_id: 1 },
    ];

    (db.selectFrom as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(mockTournamentPlayers),
          }),
        }),
      })
      .mockReturnValueOnce({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(mockMatches),
          }),
        }),
      });

    const result = await getTournamentPlayers(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].player.player_name).toBe("Alice");
      expect(result.value[0].matches).toHaveLength(1);
      expect(result.value[1].player.player_name).toBe("Bob");
      expect(result.value[1].matches).toHaveLength(1);
    }
  });

  it("returns error when database query for players throws", async () => {
    (db.selectFrom as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const result = await getTournamentPlayers(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not fetch tournament players");
    }
  });

  it("returns error when database query for matches throws", async () => {
    const mockTournamentPlayers = [
      { player_name: "Alice", tournament_id: 1, pool_id: null },
    ];

    (db.selectFrom as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(mockTournamentPlayers),
          }),
        }),
      })
      .mockReturnValueOnce({
        selectAll: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      });

    const result = await getTournamentPlayers(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not fetch tournament matches");
    }
  });
});
