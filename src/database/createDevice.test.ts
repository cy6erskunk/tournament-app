import { describe, it, expect, beforeEach, vi } from "vitest";
import { createDevice } from "./createDevice";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
  },
}));

describe("createDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new device successfully", async () => {
    const mockNewDevice = {
      device_token: "DEVICE_abc123",
      submitter_name: "Tablet 1",
      created_at: new Date("2024-01-01"),
      last_used: null,
    };

    // Mock: device doesn't exist yet
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    // Mock: insert succeeds
    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockNewDevice),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.insertInto as any) = insertIntoMock;

    const result = await createDevice("DEVICE_abc123", "Tablet 1");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(mockNewDevice);
      expect(result.value.device_token).toBe("DEVICE_abc123");
      expect(result.value.submitter_name).toBe("Tablet 1");
      expect(result.value.last_used).toBeNull();
    }
  });

  it("should create a device with different name", async () => {
    const mockNewDevice = {
      device_token: "DEVICE_xyz789",
      submitter_name: "Phone Scanner",
      created_at: new Date("2024-01-02"),
      last_used: null,
    };

    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockNewDevice),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.insertInto as any) = insertIntoMock;

    const result = await createDevice("DEVICE_xyz789", "Phone Scanner");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.submitter_name).toBe("Phone Scanner");
    }
  });

  it("should reject creation if device token already exists", async () => {
    // Mock: device already exists
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockResolvedValue({ device_token: "DEVICE_abc123" }),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await createDevice("DEVICE_abc123", "Tablet 1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Device token already exists");
    }
  });

  it("should reject creation with empty device token", async () => {
    const result = await createDevice("", "Tablet 1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Device token and submitter name are required",
      );
    }
  });

  it("should reject creation with empty submitter name", async () => {
    const result = await createDevice("DEVICE_abc123", "");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Device token and submitter name are required",
      );
    }
  });

  it("should reject creation with both fields empty", async () => {
    const result = await createDevice("", "");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Device token and submitter name are required",
      );
    }
  });

  it("should handle database insertion failure", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    // Mock: insert fails (returns undefined)
    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.insertInto as any) = insertIntoMock;

    const result = await createDevice("DEVICE_abc123", "Tablet 1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to create device");
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

    const result = await createDevice("DEVICE_abc123", "Tablet 1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error creating device");
    }
  });
});
