import { describe, it, expect, beforeEach, vi } from "vitest";
import { deleteUser } from "./deleteUser";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent deletion of the last admin user", async () => {
    // Mock: user exists and is an admin
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn()
            .mockResolvedValueOnce({ username: "admin1", role: "admin" })
            .mockResolvedValueOnce({ count: 1 }), // Only 1 admin
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await deleteUser("admin1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Cannot delete the last admin user");
    }
  });

  it("should allow deletion of an admin when other admins exist", async () => {
    // Mock: user exists and is an admin, but there are 2 admins total
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn()
            .mockResolvedValueOnce({ username: "admin1", role: "admin" })
            .mockResolvedValueOnce({ count: 2 }), // 2 admins exist
        }),
      }),
    });

    const deleteFromMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        executeTakeFirst: vi.fn().mockResolvedValue({
          numDeletedRows: BigInt(1),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.deleteFrom as any) = deleteFromMock;

    const result = await deleteUser("admin1");

    expect(result.success).toBe(true);
  });

  it("should allow deletion of regular users", async () => {
    // Mock: user exists and is a regular user
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            username: "user1",
            role: "user",
          }),
        }),
      }),
    });

    const deleteFromMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        executeTakeFirst: vi.fn().mockResolvedValue({
          numDeletedRows: BigInt(1),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.deleteFrom as any) = deleteFromMock;

    const result = await deleteUser("user1");

    expect(result.success).toBe(true);
  });

  it("should return error for non-existent user", async () => {
    // Mock: user doesn't exist
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await deleteUser("nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("User not found");
    }
  });
});
