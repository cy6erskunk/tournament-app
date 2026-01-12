"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { passwordHash } from "@/helpers/hashing";
import { UserInfo } from "./getUsers";

export async function updateUserRole(
  username: string,
  role: "user" | "admin",
): Promise<Result<UserInfo, string>> {
  try {
    if (role !== "user" && role !== "admin") {
      return { success: false, error: "Role must be either 'user' or 'admin'" };
    }

    // Check if the user exists and get their current role
    const currentUser = await db
      .selectFrom("users")
      .select(["username", "role"])
      .where("username", "=", username)
      .executeTakeFirst();

    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // If changing an admin to user, check if they're the last admin
    if (currentUser.role === "admin" && role === "user") {
      const adminCount = await db
        .selectFrom("users")
        .select(({ fn }) => [fn.count<number>("username").as("count")])
        .where("role", "=", "admin")
        .executeTakeFirst();

      if (adminCount && adminCount.count <= 1) {
        return {
          success: false,
          error: "Cannot change the last admin to user. At least one admin must remain.",
        };
      }
    }

    // Proceed with role update
    const updatedUser = await db
      .updateTable("users")
      .set({ role })
      .where("username", "=", username)
      .returning(["username", "role"])
      .executeTakeFirst();

    if (!updatedUser) {
      return { success: false, error: "User not found" };
    }

    return { success: true, value: updatedUser };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Error updating user role" };
  }
}

export async function updateUserPassword(
  username: string,
  newPassword: string,
): Promise<Result<boolean, string>> {
  try {
    if (!newPassword) {
      return { success: false, error: "Password is required" };
    }

    const hashedPassword = await passwordHash(newPassword);
    if (!hashedPassword.success) {
      return { success: false, error: hashedPassword.error };
    }

    const result = await db
      .updateTable("users")
      .set({ password: hashedPassword.value })
      .where("username", "=", username)
      .executeTakeFirst();

    if (result.numUpdatedRows === BigInt(0)) {
      return { success: false, error: "User not found" };
    }

    return { success: true, value: true };
  } catch (error) {
    console.error("Error updating user password:", error);
    return { success: false, error: "Error updating user password" };
  }
}
