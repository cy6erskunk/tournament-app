import { describe, it, expect, beforeEach, vi } from "vitest";
import { getAllUsers, getUser } from "./getUsers";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

describe("getAllUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all users without passwords", async () => {
    const mockUsers = [
      { username: "admin1", role: "admin" },
      { username: "user1", role: "user" },
      { username: "user2", role: "user" },
    ];

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue(mockUsers),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getAllUsers();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(3);
      expect(result.value).toEqual(mockUsers);
      // Verify passwords are not included
      result.value.forEach((user) => {
        expect(user).not.toHaveProperty("password");
      });
    }
  });

  it("should return users ordered by username", async () => {
    const mockUsers = [
      { username: "alice", role: "user" },
      { username: "bob", role: "admin" },
      { username: "charlie", role: "user" },
    ];

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue(mockUsers),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getAllUsers();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value[0].username).toBe("alice");
      expect(result.value[1].username).toBe("bob");
      expect(result.value[2].username).toBe("charlie");
    }
  });

  it("should return empty array when no users exist", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getAllUsers();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual([]);
    }
  });

  it("should handle database errors gracefully", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          execute: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getAllUsers();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error fetching users");
    }
  });
});

describe("getUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a specific user by username", async () => {
    const mockUser = { username: "testuser", role: "user" };

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockUser),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getUser("testuser");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(mockUser);
      expect(result.value.username).toBe("testuser");
      expect(result.value.role).toBe("user");
    }
  });

  it("should return admin user correctly", async () => {
    const mockAdmin = { username: "admin", role: "admin" };

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockAdmin),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getUser("admin");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.role).toBe("admin");
    }
  });

  it("should return error for non-existent user", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getUser("nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("User not found");
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

    const result = await getUser("testuser");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error fetching user");
    }
  });
});
