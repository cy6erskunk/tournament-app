import { describe, it, expect, beforeEach, vi } from "vitest";
import { getAllDevices, getDevice } from "./getDevices";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

describe("getAllDevices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all devices ordered by created_at desc", async () => {
    const mockDevices = [
      {
        device_token: "DEVICE_abc123",
        submitter_name: "Tablet 1",
        created_at: new Date("2024-01-03"),
        last_used: new Date("2024-01-05"),
      },
      {
        device_token: "DEVICE_xyz789",
        submitter_name: "Phone Scanner",
        created_at: new Date("2024-01-02"),
        last_used: null,
      },
      {
        device_token: "DEVICE_def456",
        submitter_name: "Tablet 2",
        created_at: new Date("2024-01-01"),
        last_used: new Date("2024-01-04"),
      },
    ];

    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue(mockDevices),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getAllDevices();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toHaveLength(3);
      expect(result.value).toEqual(mockDevices);
    }
  });

  it("should return empty array when no devices exist", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          execute: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getAllDevices();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual([]);
    }
  });

  it("should handle database errors gracefully", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          execute: vi.fn().mockRejectedValue(new Error("Database error")),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getAllDevices();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error fetching devices");
    }
  });
});

describe("getDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a specific device by token", async () => {
    const mockDevice = {
      device_token: "DEVICE_abc123",
      submitter_name: "Tablet 1",
      created_at: new Date("2024-01-01"),
      last_used: new Date("2024-01-05"),
    };

    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockDevice),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getDevice("DEVICE_abc123");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toEqual(mockDevice);
      expect(result.value.device_token).toBe("DEVICE_abc123");
      expect(result.value.submitter_name).toBe("Tablet 1");
    }
  });

  it("should return device with null last_used", async () => {
    const mockDevice = {
      device_token: "DEVICE_new",
      submitter_name: "New Device",
      created_at: new Date("2024-01-01"),
      last_used: null,
    };

    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockDevice),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getDevice("DEVICE_new");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.last_used).toBeNull();
    }
  });

  it("should return error for non-existent device", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getDevice("DEVICE_nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Device not found");
    }
  });

  it("should handle database errors gracefully", async () => {
    const selectFromMock = vi.fn().mockReturnValue({
      selectAll: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi
            .fn()
            .mockRejectedValue(new Error("Database error")),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await getDevice("DEVICE_test");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error fetching device");
    }
  });
});
