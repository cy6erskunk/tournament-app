"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { DeviceInfo } from "./getDevices";
import { generateMatchId } from "@/helpers/generateMatchId";

export async function registerDevice(
  submitterName: string,
): Promise<Result<DeviceInfo, string>> {
  try {
    if (!submitterName || submitterName.trim().length === 0) {
      return {
        success: false,
        error: "Submitter name is required",
      };
    }

    if (submitterName.length > 255) {
      return {
        success: false,
        error: "Name must be 255 characters or less",
      };
    }

    // Generate a unique device token
    const deviceToken = generateMatchId();

    const newDevice = await db
      .insertInto("submitter_devices")
      .values({
        device_token: deviceToken,
        submitter_name: submitterName.trim(),
        last_used: null,
      })
      .returningAll()
      .executeTakeFirst();

    if (!newDevice) {
      return { success: false, error: "Failed to register device" };
    }

    return { success: true, value: newDevice };
  } catch (error) {
    console.error("Error registering device:", error);
    return { success: false, error: "Error registering device" };
  }
}
