import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTournament } from "./addTournament";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

const makeTrxMock = () => ({ insertInto: vi.fn() });

const mockTransaction = (trxMock: ReturnType<typeof makeTrxMock>) => {
  (db.transaction as ReturnType<typeof vi.fn>).mockReturnValue({
    execute: vi.fn().mockImplementation(async (fn: (trx: typeof trxMock) => unknown) => fn(trxMock)),
  });
};

describe("createTournament", () => {
  const mockTournament = {
    id: 42,
    name: "Test Tournament",
    date: new Date("2026-01-01"),
    format: "Round Robin",
    require_submitter_identity: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Round Robin tournament and inserts Pool 1", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    // First call: insert tournament; second call: insert pool
    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returningAll: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
          }),
        }),
      })
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([]),
        }),
      });

    const result = await createTournament(
      new Date("2026-01-01"),
      "Round Robin",
      "Test Tournament",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe(42);
      expect(result.value.format).toBe("Round Robin");
    }

    // insertInto must be called twice: once for tournaments, once for pools
    expect(trxMock.insertInto).toHaveBeenCalledTimes(2);
    expect(trxMock.insertInto).toHaveBeenNthCalledWith(1, "tournaments");
    expect(trxMock.insertInto).toHaveBeenNthCalledWith(2, "pools");
  });

  it("inserts Pool 1 with correct tournament_id and name", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    let capturedPoolValues: unknown = null;

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returningAll: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
          }),
        }),
      })
      .mockReturnValueOnce({
        values: vi.fn().mockImplementation((v) => {
          capturedPoolValues = v;
          return { execute: vi.fn().mockResolvedValue([]) };
        }),
      });

    await createTournament(new Date("2026-01-01"), "Round Robin", "Test");

    expect(capturedPoolValues).toEqual({
      tournament_id: 42,
      name: "Pool 1",
    });
  });

  it("does NOT insert a pool for a Bracket tournament", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    (trxMock.insertInto as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockResolvedValue({ ...mockTournament, format: "Bracket" }),
        }),
      }),
    });

    const result = await createTournament(
      new Date("2026-01-01"),
      "Bracket",
      "Bracket Tournament",
    );

    expect(result.success).toBe(true);
    // Only one insertInto: for the tournament itself, not for pools
    expect(trxMock.insertInto).toHaveBeenCalledTimes(1);
    expect(trxMock.insertInto).toHaveBeenCalledWith("tournaments");
  });

  it("returns error when tournament insert returns nothing", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    (trxMock.insertInto as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const result = await createTournament(
      new Date("2026-01-01"),
      "Round Robin",
      "Test",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("No tournament returned on insert");
    }
    // Pool insert must not be attempted
    expect(trxMock.insertInto).toHaveBeenCalledTimes(1);
  });

  it("returns error when database throws", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    (trxMock.insertInto as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const result = await createTournament(
      new Date("2026-01-01"),
      "Round Robin",
      "Test",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("DB error");
    }
  });

  it("trims whitespace from tournament name", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    let capturedTournamentValues: unknown = null;

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        values: vi.fn().mockImplementation((v) => {
          capturedTournamentValues = v;
          return {
            returningAll: vi.fn().mockReturnValue({
              executeTakeFirst: vi.fn().mockResolvedValue(mockTournament),
            }),
          };
        }),
      })
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([]),
        }),
      });

    await createTournament(new Date("2026-01-01"), "Round Robin", "  Padded  ");

    expect((capturedTournamentValues as { name: string }).name).toBe("Padded");
  });
});
