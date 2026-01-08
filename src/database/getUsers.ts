"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { Users } from "@/types/Kysely";

export type UserInfo = Omit<Users, "password">;

export async function getAllUsers(): Promise<Result<UserInfo[], string>> {
  try {
    const users = await db
      .selectFrom("users")
      .select(["username", "role"])
      .orderBy("username", "asc")
      .execute();

    return { success: true, value: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, error: "Error fetching users" };
  }
}

export async function getUser(
  username: string,
): Promise<Result<UserInfo, string>> {
  try {
    const user = await db
      .selectFrom("users")
      .select(["username", "role"])
      .where("username", "=", username)
      .executeTakeFirst();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, value: user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { success: false, error: "Error fetching user" };
  }
}
