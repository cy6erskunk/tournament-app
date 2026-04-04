import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getRounds,
  createRound,
  createRoundNext,
  deleteRound,
  updateRound,
} from "./getRounds";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    deleteFrom: vi.fn(),
    updateTable: vi.fn(),
  },
}));

describe("getRounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all rounds for a tournament ordered by round_order", async () => {
    const mockRounds = [
      { id: 1, tournament_id: 1, round_order: 1, type: "pools" },
      { id: 2, tournament_id: 1, round_order: 2, type: "pools" },
    ];

    (db.selectFrom as any) = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(mockRounds),
          }),
        }),
      }),
    });

    const result = await getRounds(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].type).toBe("pools");
      expect(result.value[0].round_order).toBe(1);
      expect(result.value[1].round_order).toBe(2);
    }
  });

  it("should return empty array when no rounds exist", async () => {
    (db.selectFrom as any) = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const result = await getRounds(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(0);
    }
  });

  it("should handle database errors gracefully", async () => {
    (db.selectFrom as any) = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      }),
    });

    const result = await getRounds(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not fetch rounds");
    }
  });
});

describe("createRound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a pools round successfully", async () => {
    const mockRound = { id: 1, tournament_id: 1, round_order: 1, type: "pools" };

    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockRound),
        }),
      }),
    });

    const result = await createRound(1, "pools", 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.type).toBe("pools");
      expect(result.value.round_order).toBe(1);
      expect(result.value.tournament_id).toBe(1);
    }
  });

  it("should create an elimination round successfully", async () => {
    const mockRound = { id: 2, tournament_id: 1, round_order: 1, type: "elimination" };

    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockRound),
        }),
      }),
    });

    const result = await createRound(1, "elimination", 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.type).toBe("elimination");
    }
  });

  it("should return error when round creation returns nothing", async () => {
    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const result = await createRound(1, "pools", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create round");
    }
  });

  it("should handle database errors gracefully", async () => {
    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const result = await createRound(1, "pools", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create round");
    }
  });
});

describe("createRoundNext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a round with order computed by DB subquery", async () => {
    const mockRound = { id: 3, tournament_id: 1, round_order: 3, type: "pools" };

    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockRound),
        }),
      }),
    });

    const result = await createRoundNext(1, "pools");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.round_order).toBe(3);
      expect(result.value.type).toBe("pools");
    }
    expect(db.insertInto).toHaveBeenCalledWith("rounds");
  });

  it("should return error when insert returns nothing", async () => {
    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const result = await createRoundNext(1, "elimination");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create round");
    }
  });

  it("should handle database errors gracefully", async () => {
    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const result = await createRoundNext(1, "pools");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create round");
    }
  });
});

describe("deleteRound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a round successfully", async () => {
    (db.deleteFrom as any) = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
    });

    const result = await deleteRound(1, 10);

    expect(result.success).toBe(true);
  });

  it("should handle database errors gracefully", async () => {
    (db.deleteFrom as any) = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      }),
    });

    const result = await deleteRound(1, 10);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not delete round");
    }
  });
});

describe("updateRound", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a round order successfully", async () => {
    const mockRound = { id: 1, tournament_id: 1, round_order: 2, type: "pools" };
    const mockWhere = vi.fn().mockReturnValue({
      returningAll: vi.fn().mockReturnValue({
        executeTakeFirst: vi.fn().mockResolvedValue(mockRound),
      }),
    });

    (db.updateTable as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      }),
    });

    const result = await updateRound(1, 1, { round_order: 2 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.round_order).toBe(2);
    }
  });

  it("should return error when round is not found", async () => {
    const mockWhere = vi.fn().mockReturnValue({
      returningAll: vi.fn().mockReturnValue({
        executeTakeFirst: vi.fn().mockResolvedValue(undefined),
      }),
    });

    (db.updateTable as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      }),
    });

    const result = await updateRound(999, 1, { type: "elimination" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Round not found");
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockWhere = vi.fn().mockReturnValue({
      returningAll: vi.fn().mockReturnValue({
        executeTakeFirst: vi.fn().mockRejectedValue(new Error("DB error")),
      }),
    });

    (db.updateTable as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: mockWhere,
        }),
      }),
    });

    const result = await updateRound(1, 1, { type: "pools" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not update round");
    }
  });
});
