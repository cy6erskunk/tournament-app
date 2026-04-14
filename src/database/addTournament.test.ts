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

// Returns a chainable mock: insertInto → values → execute (for pool/rounds inserts)
const makeInsertMock = () => ({
  values: vi.fn().mockReturnValue({ execute: vi.fn().mockResolvedValue([]) }),
});

// Returns a chainable mock: insertInto → values → returningAll → executeTakeFirst (for tournament insert)
const makeTournamentInsertMock = (returnValue: unknown) => ({
  values: vi.fn().mockReturnValue({
    returningAll: vi.fn().mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue(returnValue),
    }),
  }),
});

describe("createTournament", () => {
  const mockTournament = {
    id: 42,
    name: "Test Tournament",
    date: new Date("2026-01-01"),
    require_submitter_identity: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Round Robin tournament with pool and two rounds", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(makeTournamentInsertMock(mockTournament)) // tournaments
      .mockReturnValueOnce(makeInsertMock())                         // pools
      .mockReturnValueOnce(makeInsertMock());                        // rounds

    const result = await createTournament(
      new Date("2026-01-01"),
      "Round Robin",
      "Test Tournament",
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe(42);
    }

    expect(trxMock.insertInto).toHaveBeenCalledTimes(3);
    expect(trxMock.insertInto).toHaveBeenNthCalledWith(1, "tournaments");
    expect(trxMock.insertInto).toHaveBeenNthCalledWith(2, "pools");
    expect(trxMock.insertInto).toHaveBeenNthCalledWith(3, "rounds");
  });

  it("inserts Pool 1 with correct tournament_id and name for Round Robin", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    let capturedPoolValues: unknown = null;

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(makeTournamentInsertMock(mockTournament))
      .mockReturnValueOnce({
        values: vi.fn().mockImplementation((v) => {
          capturedPoolValues = v;
          return { execute: vi.fn().mockResolvedValue([]) };
        }),
      })
      .mockReturnValueOnce(makeInsertMock());

    await createTournament(new Date("2026-01-01"), "Round Robin", "Test");

    expect(capturedPoolValues).toEqual({ tournament_id: 42, name: "Pool 1" });
  });

  it("inserts two pool rounds for Round Robin", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    let capturedRoundValues: unknown = null;

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(makeTournamentInsertMock(mockTournament))
      .mockReturnValueOnce(makeInsertMock())
      .mockReturnValueOnce({
        values: vi.fn().mockImplementation((v) => {
          capturedRoundValues = v;
          return { execute: vi.fn().mockResolvedValue([]) };
        }),
      });

    await createTournament(new Date("2026-01-01"), "Round Robin", "Test");

    expect(capturedRoundValues).toEqual([
      { tournament_id: 42, round_order: 1, type: "pools" },
      { tournament_id: 42, round_order: 2, type: "pools" },
    ]);
  });

  it("creates a Brackets tournament with one elimination round and no pool", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    let capturedRoundValues: unknown = null;

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(makeTournamentInsertMock({ ...mockTournament }))
      .mockReturnValueOnce({
        values: vi.fn().mockImplementation((v) => {
          capturedRoundValues = v;
          return { execute: vi.fn().mockResolvedValue([]) };
        }),
      });

    const result = await createTournament(
      new Date("2026-01-01"),
      "Brackets",
      "Bracket Tournament",
    );

    expect(result.success).toBe(true);
    expect(trxMock.insertInto).toHaveBeenCalledTimes(2);
    expect(trxMock.insertInto).toHaveBeenNthCalledWith(1, "tournaments");
    expect(trxMock.insertInto).toHaveBeenNthCalledWith(2, "rounds");
    expect(capturedRoundValues).toEqual({
      tournament_id: 42,
      round_order: 1,
      type: "elimination",
    });
  });

  it("returns error immediately for an unknown format without touching the DB", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    const result = await createTournament(
      new Date("2026-01-01"),
      "Bracket",
      "Typo Tournament",
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Bracket");
    }
    expect(db.transaction).not.toHaveBeenCalled();
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

  it("persists public_results as true for Round Robin when enabled", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    let capturedValues: unknown = null;

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        values: vi.fn().mockImplementation((v) => {
          capturedValues = v;
          return {
            returningAll: vi.fn().mockReturnValue({
              executeTakeFirst: vi.fn().mockResolvedValue({ ...mockTournament, public_results: true }),
            }),
          };
        }),
      })
      .mockReturnValueOnce(makeInsertMock())
      .mockReturnValueOnce(makeInsertMock());

    await createTournament(new Date("2026-01-01"), "Round Robin", "Test", false, true);

    expect((capturedValues as { public_results: boolean }).public_results).toBe(true);
  });

  it("persists public_results as true for Brackets tournaments when enabled", async () => {
    const trxMock = makeTrxMock();
    mockTransaction(trxMock);

    let capturedValues: unknown = null;

    (trxMock.insertInto as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        values: vi.fn().mockImplementation((v) => {
          capturedValues = v;
          return {
            returningAll: vi.fn().mockReturnValue({
              executeTakeFirst: vi.fn().mockResolvedValue({ ...mockTournament, public_results: true }),
            }),
          };
        }),
      })
      .mockReturnValueOnce(makeInsertMock());

    await createTournament(new Date("2026-01-01"), "Brackets", "Bracket Tourney", false, true);

    expect((capturedValues as { public_results: boolean }).public_results).toBe(true);
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
      .mockReturnValueOnce(makeInsertMock())
      .mockReturnValueOnce(makeInsertMock());

    await createTournament(new Date("2026-01-01"), "Round Robin", "  Padded  ");

    expect((capturedTournamentValues as { name: string }).name).toBe("Padded");
  });
});
