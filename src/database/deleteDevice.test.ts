import { describe, it, expect, beforeEach, vi } from "vitest";
import { deleteDevice } from "./deleteDevice";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

describe("deleteDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete a device successfully", async () => {
    // Mock: device exists
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            device_token: "DEVICE_abc123",
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

    const result = await deleteDevice("DEVICE_abc123");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(true);
    }
  });

  it("should delete multiple different devices", async () => {
    const devices = ["DEVICE_abc123", "DEVICE_xyz789", "DEVICE_def456"];

    for (const deviceToken of devices) {
      const selectFromMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue({
              device_token: deviceToken,
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

      const result = await deleteDevice(deviceToken);
      expect(result.success).toBe(true);
    }
  });

  it("should return error for non-existent device", async () => {
    // Mock: device doesn't exist
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;

    const result = await deleteDevice("DEVICE_nonexistent");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Device not found");
    }
  });

  it("should handle database deletion failure", async () => {
    // Mock: device exists but deletion returns 0 rows
    const selectFromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue({
            device_token: "DEVICE_abc123",
          }),
        }),
      }),
    });

    const deleteFromMock = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        executeTakeFirst: vi.fn().mockResolvedValue({
          numDeletedRows: BigInt(0),
        }),
      }),
    });

    (db.selectFrom as any) = selectFromMock;
    (db.deleteFrom as any) = deleteFromMock;

    const result = await deleteDevice("DEVICE_abc123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Device not found");
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

    const result = await deleteDevice("DEVICE_abc123");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error deleting device");
    }
  });
});
