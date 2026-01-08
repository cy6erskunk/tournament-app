import { describe, it, expect, beforeEach, vi } from "vitest";
import { createUser } from "./createUser";
import { db } from "./database";
import { passwordHash } from "@/helpers/hashing";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
  },
}));

vi.mock("@/helpers/hashing", () => ({
  passwordHash: vi.fn(),
}));

describe("createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new user successfully", async () => {
    const mockHashedPassword = "hashed_password_123";
    const mockNewUser = { username: "newuser", role: "user" };

    // Mock: user doesn't exist yet
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    // Mock: password hashing succeeds
    (passwordHash as any).mockResolvedValue({
      success: true,
      value: mockHashedPassword,
    });

    // Mock: insert succeeds
    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockNewUser),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.insertInto as any) = insertIntoMock;

    const result = await createUser("newuser", "password123", "user");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(mockNewUser);
      expect(result.value.username).toBe("newuser");
      expect(result.value.role).toBe("user");
    }
  });

  it("should create an admin user successfully", async () => {
    const mockHashedPassword = "hashed_admin_password";
    const mockNewAdmin = { username: "newadmin", role: "admin" };

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (passwordHash as any).mockResolvedValue({
      success: true,
      value: mockHashedPassword,
    });

    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockNewAdmin),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.insertInto as any) = insertIntoMock;

    const result = await createUser("newadmin", "adminpass", "admin");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.role).toBe("admin");
    }
  });

  it("should reject creation if username already exists", async () => {
    // Mock: user already exists
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockResolvedValue({ username: "existinguser" }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await createUser("existinguser", "password123", "user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Username already exists");
    }
  });

  it("should reject creation with empty username", async () => {
    const result = await createUser("", "password123", "user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Username and password are required");
    }
  });

  it("should reject creation with empty password", async () => {
    const result = await createUser("newuser", "", "user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Username and password are required");
    }
  });

  it("should reject invalid role values", async () => {
    const result = await createUser("newuser", "password123", "superadmin" as any);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Role must be either 'user' or 'admin'");
    }
  });

  it("should handle password hashing failure", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    // Mock: password hashing fails
    (passwordHash as any).mockResolvedValue({
      success: false,
      error: "Hashing failed",
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await createUser("newuser", "password123", "user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Hashing failed");
    }
  });

  it("should handle database insertion failure", async () => {
    const mockHashedPassword = "hashed_password_123";

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (passwordHash as any).mockResolvedValue({
      success: true,
      value: mockHashedPassword,
    });

    // Mock: insert fails (returns undefined)
    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.insertInto as any) = insertIntoMock;

    const result = await createUser("newuser", "password123", "user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to create user");
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

    const result = await createUser("newuser", "password123", "user");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error creating user");
    }
  });
});
