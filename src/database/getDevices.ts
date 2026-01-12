"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { SubmitterDevices } from "@/types/Kysely";

export type DeviceInfo = SubmitterDevices;

export async function getAllDevices(): Promise<Result<DeviceInfo[], string>> {
  try {
    const devices = await db
      .selectFrom("submitter_devices")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    return { success: true, value: devices };
  } catch (error) {
    console.error("Error fetching devices:", error);
    return { success: false, error: "Error fetching devices" };
  }
}

export async function getDevice(
  deviceToken: string,
): Promise<Result<DeviceInfo, string>> {
  try {
    const device = await db
      .selectFrom("submitter_devices")
      .selectAll()
      .where("device_token", "=", deviceToken)
      .executeTakeFirst();

    if (!device) {
      return { success: false, error: "Device not found" };
    }

    return { success: true, value: device };
  } catch (error) {
    console.error("Error fetching device:", error);
    return { success: false, error: "Error fetching device" };
  }
}
