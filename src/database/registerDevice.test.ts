import { describe, it, expect, beforeEach, vi } from "vitest";
import { registerDevice } from "./registerDevice";
import { db } from "./database";
import { generateMatchId } from "@/helpers/generateMatchId";

vi.mock("./database", () => ({
  db: {
    insertInto: vi.fn(),
  },
}));

vi.mock("@/helpers/generateMatchId", () => ({
  generateMatchId: vi.fn(),
}));

describe("registerDevice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a device with auto-generated token", async () => {
    const mockDeviceToken = "DEVICE_auto123";
    const mockNewDevice = {
      device_token: mockDeviceToken,
      submitter_name: "Scanner App",
      created_at: new Date("2024-01-01"),
      last_used: null,
    };

    (generateMatchId as any).mockReturnValue(mockDeviceToken);

    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockNewDevice),
        }),
      }),
    });

    (db.insertInto as any) = insertIntoMock;

    const result = await registerDevice("Scanner App");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.device_token).toBe(mockDeviceToken);
      expect(result.value.submitter_name).toBe("Scanner App");
      expect(result.value.last_used).toBeNull();
    }
    expect(generateMatchId).toHaveBeenCalled();
  });

  it("should trim whitespace from submitter name", async () => {
    const mockDeviceToken = "DEVICE_trim123";
    const mockNewDevice = {
      device_token: mockDeviceToken,
      submitter_name: "Tablet Scanner",
      created_at: new Date("2024-01-01"),
      last_used: null,
    };

    (generateMatchId as any).mockReturnValue(mockDeviceToken);

    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockNewDevice),
        }),
      }),
    });

    (db.insertInto as any) = insertIntoMock;

    const result = await registerDevice("  Tablet Scanner  ");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.submitter_name).toBe("Tablet Scanner");
    }
  });

  it("should reject empty submitter name", async () => {
    const result = await registerDevice("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Submitter name is required");
    }
  });

  it("should reject whitespace-only submitter name", async () => {
    const result = await registerDevice("   ");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Submitter name is required");
    }
  });

  it("should reject submitter name longer than 255 characters", async () => {
    const longName = "a".repeat(256);
    const result = await registerDevice(longName);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Name must be 255 characters or less");
    }
  });

  it("should accept submitter name exactly 255 characters", async () => {
    const exactName = "a".repeat(255);
    const mockDeviceToken = "DEVICE_long123";
    const mockNewDevice = {
      device_token: mockDeviceToken,
      submitter_name: exactName,
      created_at: new Date("2024-01-01"),
      last_used: null,
    };

    (generateMatchId as any).mockReturnValue(mockDeviceToken);

    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(mockNewDevice),
        }),
      }),
    });

    (db.insertInto as any) = insertIntoMock;

    const result = await registerDevice(exactName);

    expect(result.success).toBe(true);
  });

  it("should handle database insertion failure", async () => {
    const mockDeviceToken = "DEVICE_fail123";

    (generateMatchId as any).mockReturnValue(mockDeviceToken);

    const insertIntoMock = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returningAll: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    });

    (db.insertInto as any) = insertIntoMock;

    const result = await registerDevice("Test Device");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Failed to register device");
    }
  });

  it("should handle database errors gracefully", async () => {
    const mockDeviceToken = "DEVICE_error123";

    (generateMatchId as any).mockReturnValue(mockDeviceToken);

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

    const result = await registerDevice("Error Device");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Error registering device");
    }
  });

  it("should generate unique tokens for each registration", async () => {
    const tokens = ["TOKEN_1", "TOKEN_2", "TOKEN_3"];
    let callCount = 0;

    (generateMatchId as any).mockImplementation(() => tokens[callCount++]);

    for (let i = 0; i < 3; i++) {
      const mockNewDevice = {
        device_token: tokens[i],
        submitter_name: `Device ${i}`,
        created_at: new Date("2024-01-01"),
        last_used: null,
      };

      const insertIntoMock = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returningAll: vi.fn().mockReturnValue({
            executeTakeFirst: vi.fn().mockResolvedValue(mockNewDevice),
          }),
        }),
      });

      (db.insertInto as any) = insertIntoMock;

      const result = await registerDevice(`Device ${i}`);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.device_token).toBe(tokens[i]);
      }
    }

    expect(generateMatchId).toHaveBeenCalledTimes(3);
  });
});
