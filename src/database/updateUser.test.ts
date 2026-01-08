import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateUserRole, updateUserPassword } from "./updateUser";
import { db } from "./database";
import { passwordHash } from "@/helpers/hashing";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    updateTable: vi.fn(),
  },
}));

vi.mock("@/helpers/hashing", () => ({
  passwordHash: vi.fn(),
}));

describe("updateUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent changing the last admin to user", async () => {
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

    const result = await updateUserRole("admin1", "user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Cannot change the last admin to user");
    }
  });

  it("should allow changing an admin to user when other admins exist", async () => {
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

    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue({
              username: "admin1",
              role: "user",
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.updateTable as any) = updateTableMock;

    const result = await updateUserRole("admin1", "user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.username).toBe("admin1");
      expect(result.value.role).toBe("user");
    }
  });

  it("should allow changing a user to admin", async () => {
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

    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue({
              username: "user1",
              role: "admin",
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.updateTable as any) = updateTableMock;

    const result = await updateUserRole("user1", "admin");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.username).toBe("user1");
      expect(result.value.role).toBe("admin");
    }
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

    const result = await updateUserRole("nonexistent", "admin");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("User not found");
    }
  });

  it("should reject invalid role values", async () => {
    const result = await updateUserRole("user1", "invalid" as any);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Role must be either");
    }
  });

  it("should allow changing admin role to admin (no-op scenario)", async () => {
    // Mock: user exists and is already an admin
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            username: "admin1",
            role: "admin",
          }),
        }),
      }),
    });

    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue({
              username: "admin1",
              role: "admin",
            }),
          }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.updateTable as any) = updateTableMock;

    const result = await updateUserRole("admin1", "admin");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.username).toBe("admin1");
      expect(result.value.role).toBe("admin");
    }
  });
});

describe("updateUserPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update user password successfully", async () => {
    const mockHashedPassword = "new_hashed_password_456";

    // Mock: password hashing succeeds
    (passwordHash as any).mockResolvedValue({
      success: true,
      value: mockHashedPassword,
    });

    // Mock: update succeeds
    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            numUpdatedRows: BigInt(1),
          }),
        }),
      }),
    });

    (db.updateTable as any) = updateTableMock;

    const result = await updateUserPassword("testuser", "newpassword123");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(true);
    }
  });

  it("should reject empty password", async () => {
    const result = await updateUserPassword("testuser", "");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Password is required");
    }
  });

  it("should handle password hashing failure", async () => {
    // Mock: password hashing fails
    (passwordHash as any).mockResolvedValue({
      success: false,
      error: "Hashing error",
    });

    const result = await updateUserPassword("testuser", "newpassword123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Hashing error");
    }
  });

  it("should return error when user not found", async () => {
    const mockHashedPassword = "new_hashed_password_456";

    (passwordHash as any).mockResolvedValue({
      success: true,
      value: mockHashedPassword,
    });

    // Mock: update affects 0 rows (user not found)
    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            numUpdatedRows: BigInt(0),
          }),
        }),
      }),
    });

    (db.updateTable as any) = updateTableMock;

    const result = await updateUserPassword("nonexistent", "newpassword123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("User not found");
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockHashedPassword = "new_hashed_password_456";

    (passwordHash as any).mockResolvedValue({
      success: true,
      value: mockHashedPassword,
    });

    // Mock: database error during update
    const updateTableMock = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockRejectedValue(new Error("Database error")),
        }),
      }),
    });

    (db.updateTable as any) = updateTableMock;

    const result = await updateUserPassword("testuser", "newpassword123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error updating user password");
    }
  });
});
