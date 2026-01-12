"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { DeviceInfo } from "./getDevices";

export async function createDevice(
  deviceToken: string,
  submitterName: string,
): Promise<Result<DeviceInfo, string>> {
  try {
    if (!deviceToken || !submitterName) {
      return {
        success: false,
        error: "Device token and submitter name are required",
      };
    }

    // Check if device token already exists
    const existingDevice = await db
      .selectFrom("submitter_devices")
      .select("device_token")
      .where("device_token", "=", deviceToken)
      .executeTakeFirst();

    if (existingDevice) {
      return { success: false, error: "Device token already exists" };
    }

    const newDevice = await db
      .insertInto("submitter_devices")
      .values({
        device_token: deviceToken,
        submitter_name: submitterName,
        last_used: null,
      })
      .returningAll()
      .executeTakeFirst();

    if (!newDevice) {
      return { success: false, error: "Failed to create device" };
    }

    return { success: true, value: newDevice };
  } catch (error) {
    console.error("Error creating device:", error);
    return { success: false, error: "Error creating device" };
  }
}
