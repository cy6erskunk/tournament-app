import { describe, it, expect, beforeEach, vi } from "vitest";
import { renamePlayer } from "./renamePlayer";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    updateTable: vi.fn(),
  },
}));

describe("renamePlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject empty name", async () => {
    const result = await renamePlayer("OldName", "   ");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Player name cannot be empty");
    }
  });

  it("should reject name longer than 16 characters", async () => {
    const result = await renamePlayer("OldName", "a]".repeat(9));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Player name too long (max 16 characters)");
    }
  });

  it("should validate trimmed length, not raw length", async () => {
    // 16 chars + spaces = raw length > 16, but trimmed = 16 which is OK
    const name = "  abcdefghijklmn  ";

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            numUpdatedRows: BigInt(1),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.updateTable as any) = updateTableMock;

    const result = await renamePlayer("OldName", name);
    expect(result.success).toBe(true);
  });

  it("should reject duplicate name (case-insensitive)", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockResolvedValue({ player_name: "ExistingPlayer" }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await renamePlayer("OldName", "existingplayer");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("A player with that name already exists");
    }
  });

  it("should allow renaming to same name with different case", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockResolvedValue({ player_name: "oldname" }),
        }),
      }),
    });

    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            numUpdatedRows: BigInt(1),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.updateTable as any) = updateTableMock;

    const result = await renamePlayer("oldname", "OldName");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe("OldName");
    }
  });

  it("should return error when player not found", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            numUpdatedRows: BigInt(0),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.updateTable as any) = updateTableMock;

    const result = await renamePlayer("NonExistent", "NewName");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Player not found");
    }
  });

  it("should successfully rename a player", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            numUpdatedRows: BigInt(1),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.updateTable as any) = updateTableMock;

    const result = await renamePlayer("OldName", "NewName");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe("NewName");
    }
  });

  it("should handle database errors gracefully", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockRejectedValue(new Error("Database error")),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await renamePlayer("OldName", "NewName");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error renaming player");
    }
  });
});
