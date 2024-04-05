"use server";
import { Result } from "@/types/result";
import { db } from "./database";


export async function userLogin(
  username: string,
  password: string
): Promise<Result<boolean, string>> {
  try {
    const result = await db
      .selectFrom("users")
      .where("username", "=", username)
      .where("password", "=", password)
      .executeTakeFirst();

    if (!result) {
      return { success: false, error: "Error logging in" };
    }

    return { success: true, value: true };
  } catch (error) {
    return { success: false, error: "Error logging in" };
  }
}
