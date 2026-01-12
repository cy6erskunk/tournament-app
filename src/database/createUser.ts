"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { passwordHash } from "@/helpers/hashing";
import { UserInfo } from "./getUsers";

export async function createUser(
  username: string,
  password: string,
  role: "user" | "admin",
): Promise<Result<UserInfo, string>> {
  try {
    if (!username || !password) {
      return { success: false, error: "Username and password are required" };
    }

    if (role !== "user" && role !== "admin") {
      return { success: false, error: "Role must be either 'user' or 'admin'" };
    }

    const existingUser = await db
      .selectFrom("users")
      .select("username")
      .where("username", "=", username)
      .executeTakeFirst();

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    const hashedPassword = await passwordHash(password);
    if (!hashedPassword.success) {
      return { success: false, error: hashedPassword.error };
    }

    const newUser = await db
      .insertInto("users")
      .values({
        username,
        password: hashedPassword.value,
        role,
      })
      .returning(["username", "role"])
      .executeTakeFirst();

    if (!newUser) {
      return { success: false, error: "Failed to create user" };
    }

    return { success: true, value: newUser };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Error creating user" };
  }
}
