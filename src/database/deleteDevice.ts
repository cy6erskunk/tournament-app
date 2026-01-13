"use server";
import { Result } from "@/types/result";
import { db } from "./database";

export async function deleteDevice(
  deviceToken: string,
): Promise<Result<boolean, string>> {
  try {
    // Check if the device exists
    const deviceToDelete = await db
      .selectFrom("submitter_devices")
      .select("device_token")
      .where("device_token", "=", deviceToken)
      .executeTakeFirst();

    if (!deviceToDelete) {
      return { success: false, error: "Device not found" };
    }

    // Proceed with deletion
    const result = await db
      .deleteFrom("submitter_devices")
      .where("device_token", "=", deviceToken)
      .executeTakeFirst();

    if (result.numDeletedRows === BigInt(0)) {
      return { success: false, error: "Device not found" };
    }

    return { success: true, value: true };
  } catch (error) {
    console.error("Error deleting device:", error);
    return { success: false, error: "Error deleting device" };
  }
}
