import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPools,
  createPool,
  deletePool,
  assignPlayerToPool,
} from "./getPools";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    deleteFrom: vi.fn(),
    updateTable: vi.fn(),
  },
}));

describe("getPools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all pools for a tournament", async () => {
    const mockPools = [
      { id: 1, tournament_id: 1, name: "Pool A" },
      { id: 2, tournament_id: 1, name: "Pool B" },
    ];

    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(mockPools),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getPools(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].name).toBe("Pool A");
      expect(result.value[1].name).toBe("Pool B");
    }
  });

  it("should return empty array when no pools exist", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getPools(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(0);
    }
  });

  it("should handle database errors gracefully", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getPools(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not fetch pools");
    }
  });
});

describe("createPool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a pool successfully", async () => {
    const mockPool = { id: 1, tournament_id: 1, name: "Pool A" };

    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockPool),
        }),
      }),
    });

    (db.insertInto as any) = insertIntoMock;

    const result = await createPool(1, "Pool A");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.name).toBe("Pool A");
      expect(result.value.tournament_id).toBe(1);
    }
  });

  it("should return error when pool creation fails", async () => {
    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.insertInto as any) = insertIntoMock;

    const result = await createPool(1, "Pool A");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create pool");
    }
  });

  it("should handle database errors gracefully", async () => {
    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockRejectedValue(new Error("Database error")),
        }),
      }),
    });

    (db.insertInto as any) = insertIntoMock;

    const result = await createPool(1, "Pool A");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create pool");
    }
  });
});

describe("deletePool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a pool successfully", async () => {
    const deleteFromMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    });

    (db.deleteFrom as any) = deleteFromMock;

    const result = await deletePool(1);

    expect(result.success).toBe(true);
  });

  it("should handle database errors gracefully", async () => {
    const deleteFromMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error("Database error")),
      }),
    });

    (db.deleteFrom as any) = deleteFromMock;

    const result = await deletePool(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not delete pool");
    }
  });
});

describe("assignPlayerToPool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should assign a player to a pool successfully", async () => {
    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue([{ player_name: "Alice" }]),
          }),
        }),
      }),
    });

    (db.updateTable as any) = updateTableMock;

    const result = await assignPlayerToPool("Alice", 1, 2);

    expect(result.success).toBe(true);
  });

  it("should unassign a player from a pool when poolId is null", async () => {
    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue([{ player_name: "Alice" }]),
          }),
        }),
      }),
    });

    (db.updateTable as any) = updateTableMock;

    const result = await assignPlayerToPool("Alice", 1, null);

    expect(result.success).toBe(true);
  });

  it("should handle database errors gracefully", async () => {
    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            execute: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      }),
    });

    (db.updateTable as any) = updateTableMock;

    const result = await assignPlayerToPool("Alice", 1, 2);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not assign player to pool");
    }
  });
});
