"use server";
import { Result } from "@/types/result";
import { db } from "./database";

export async function deleteUser(
  username: string,
): Promise<Result<boolean, string>> {
  try {
    // Check if the user exists and get their role
    const userToDelete = await db
      .selectFrom("users")
      .select(["username", "role"])
      .where("username", "=", username)
      .executeTakeFirst();

    if (!userToDelete) {
      return { success: false, error: "User not found" };
    }

    // If deleting an admin, check if they're the last one
    if (userToDelete.role === "admin") {
      const adminCount = await db
        .selectFrom("users")
        .select(({ fn }) => [fn.count<number>("username").as("count")])
        .where("role", "=", "admin")
        .executeTakeFirst();

      if (adminCount && adminCount.count <= 1) {
        return {
          success: false,
          error: "Cannot delete the last admin user. At least one admin must remain.",
        };
      }
    }

    // Proceed with deletion
    const result = await db
      .deleteFrom("users")
      .where("username", "=", username)
      .executeTakeFirst();

    if (result.numDeletedRows === BigInt(0)) {
      return { success: false, error: "User not found" };
    }

    return { success: true, value: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Error deleting user" };
  }
}
