import { describe, it, expect, vi, beforeEach } from "vitest";
import { updatePlayersBracketSeeding } from "./newPlayer";
import { db } from "./database";
import type { Player } from "@/types/Player";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    transaction: vi.fn(),
  },
}));

function makePlayer(name: string, bracketMatch: number, bracketSeed: number): Player {
  return {
    player: {
      player_name: name,
      tournament_id: 1,
      bracket_match: bracketMatch,
      bracket_seed: bracketSeed,
      pool_id: null,
    },
    matches: [],
  };
}

function makeTrxMock() {
  const executeMock = vi.fn().mockResolvedValue(undefined);
  const whereMock2 = vi.fn().mockReturnValue({ execute: executeMock });
  const whereMock1 = vi.fn().mockReturnValue({ where: whereMock2 });
  const setMock = vi.fn().mockReturnValue({ where: whereMock1 });
  const updateTableMock = vi.fn().mockReturnValue({ set: setMock });
  return { updateTable: updateTableMock, execute: executeMock };
}

describe("updatePlayersBracketSeeding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates bracket_match and bracket_seed for each player", async () => {
    const trx = makeTrxMock();
    (db.transaction as any).mockReturnValue({
      execute: vi.fn().mockImplementation((cb: (t: typeof trx) => Promise<void>) => cb(trx)),
    });

    const players = [makePlayer("Alice", 1, 1), makePlayer("Bob", 1, 2)];
    const result = await updatePlayersBracketSeeding(players);

    expect(result.success).toBe(true);
    if (result.success) expect(result.value).toBe(2);
    expect(trx.updateTable).toHaveBeenCalledTimes(2);
  });

  it("returns success with 0 when player list is empty", async () => {
    const result = await updatePlayersBracketSeeding([]);
    expect(result.success).toBe(true);
    if (result.success) expect(result.value).toBe(0);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("skips players with null bracket_match", async () => {
    const trx = makeTrxMock();
    (db.transaction as any).mockReturnValue({
      execute: vi.fn().mockImplementation((cb: (t: typeof trx) => Promise<void>) => cb(trx)),
    });

    const players = [
      makePlayer("Alice", 1, 1),
      { ...makePlayer("Bob", 1, 2), player: { ...makePlayer("Bob", 1, 2).player, bracket_match: null } },
    ];
    const result = await updatePlayersBracketSeeding(players);

    expect(result.success).toBe(true);
    expect(trx.updateTable).toHaveBeenCalledTimes(1);
  });

  it("returns failure when the transaction throws", async () => {
    (db.transaction as any).mockReturnValue({
      execute: vi.fn().mockRejectedValue(new Error("DB error")),
    });

    const players = [makePlayer("Alice", 1, 1)];
    const result = await updatePlayersBracketSeeding(players);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
  });
});
