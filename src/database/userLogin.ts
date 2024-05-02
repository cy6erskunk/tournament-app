"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { addCookie } from "@/helpers/addcookie";
import { passwordCheck } from "@/helpers/hashing";
import { UserAccountInfo } from "@/context/UserContext";

export async function userLogin(
  username: string,
  password: string,
): Promise<Result<UserAccountInfo, string>> {
  try {
    const result = await db
      .selectFrom("users")
      .selectAll()
      .where("username", "=", username)
      .executeTakeFirst();

    if (!result) {
      return { success: false, error: "Wrong username or password" };
    }

    const isPasswordValid = await passwordCheck(password, result.password);
    if (!isPasswordValid.success) {
      return { success: false, error: isPasswordValid.error };
    }

    const token = await addCookie(result.username, result.role);
    if (!token.success) {
      return { success: false, error: token.error };
    }

    if (result.role !== "user" && result.role !== "admin") {
      return {
        success: false,
        error: `Invalid accout role, only supports lower case user or admin, got: ${result.role}`,
      };
    }

    const user = {
      name: result.username,
      role: result.role,
    } as UserAccountInfo;
    return { success: true, value: user };
  } catch (error) {
    return { success: false, error: "Error logging in" };
  }
}
