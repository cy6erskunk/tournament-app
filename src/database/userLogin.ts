"use server";
import { Result } from "@/types/result";
import { db } from "./database";
import { addCookie } from "@/helpers/addcookie";
import { passwordCheck } from "@/helpers/hashing";

export async function userLogin(
  username: string,
  password: string
): Promise<Result<boolean, string>> {
  try {
    const result = await db
      .selectFrom("users")
      .select("users.password")
      .where("username", "=", username)
      .where("role", "=", "admin")
      .executeTakeFirst();

    if (!result) {
      return { success: false, error: "Error logging in" };
    }

    const isPasswordValid = await passwordCheck(password, result.password);
    if (!isPasswordValid.success) {
      return { success: false, error: isPasswordValid.error };
    }

    const token = await addCookie();
    if (!token.success) {
      return { success: false, error: token.error };
    }

    // NOTE: return token to client side if needed

    return { success: true, value: true };
  } catch (error) {
    return { success: false, error: "Error logging in" };
  }
}
