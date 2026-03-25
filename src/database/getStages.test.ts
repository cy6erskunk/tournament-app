import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStages,
  createStage,
  deleteStage,
  updateStage,
} from "./getStages";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    deleteFrom: vi.fn(),
    updateTable: vi.fn(),
  },
}));

describe("getStages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all stages for a tournament ordered by stage_order", async () => {
    const mockStages = [
      { id: 1, tournament_id: 1, stage_order: 1, type: "pools", name: "" },
      { id: 2, tournament_id: 1, stage_order: 2, type: "elimination", name: "" },
    ];

    (db.selectFrom as any) = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue(mockStages),
          }),
        }),
      }),
    });

    const result = await getStages(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].type).toBe("pools");
      expect(result.value[1].type).toBe("elimination");
    }
  });

  it("should return empty array when no stages exist", async () => {
    (db.selectFrom as any) = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            execute: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const result = await getStages(1);

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

    const result = await getStages(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not fetch stages");
    }
  });
});

describe("createStage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a pools stage successfully", async () => {
    const mockStage = {
      id: 1,
      tournament_id: 1,
      stage_order: 1,
      type: "pools",
      name: "",
    };

    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockStage),
        }),
      }),
    });

    const result = await createStage(1, "pools", 1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.type).toBe("pools");
      expect(result.value.stage_order).toBe(1);
      expect(result.value.tournament_id).toBe(1);
    }
  });

  it("should create an elimination stage with a name", async () => {
    const mockStage = {
      id: 2,
      tournament_id: 1,
      stage_order: 2,
      type: "elimination",
      name: "Playoffs",
    };

    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockStage),
        }),
      }),
    });

    const result = await createStage(1, "elimination", 2, "Playoffs");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.type).toBe("elimination");
      expect(result.value.name).toBe("Playoffs");
    }
  });

  it("should return error when stage creation returns nothing", async () => {
    (db.insertInto as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const result = await createStage(1, "pools", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create stage");
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

    const result = await createStage(1, "pools", 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not create stage");
    }
  });
});

describe("deleteStage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a stage successfully", async () => {
    (db.deleteFrom as any) = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
    });

    const result = await deleteStage(1, 10);

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

    const result = await deleteStage(1, 10);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not delete stage");
    }
  });
});

describe("updateStage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update a stage name successfully", async () => {
    const mockStage = {
      id: 1,
      tournament_id: 1,
      stage_order: 1,
      type: "pools",
      name: "Group Stage",
    };

    (db.updateTable as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returningAll: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue(mockStage),
          }),
        }),
      }),
    });

    const result = await updateStage(1, { name: "Group Stage" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.name).toBe("Group Stage");
    }
  });

  it("should return error when stage is not found", async () => {
    (db.updateTable as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returningAll: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }),
    });

    const result = await updateStage(999, { name: "Nonexistent" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Stage not found");
    }
  });

  it("should handle database errors gracefully", async () => {
    (db.updateTable as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returningAll: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      }),
    });

    const result = await updateStage(1, { name: "x" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not update stage");
    }
  });
});
