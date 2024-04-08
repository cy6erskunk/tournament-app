"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Result } from "@/types/result";

// NOTE:
// jsonwebtoken docs https://www.npmjs.com/package/jsonwebtoken

export async function addCookie(): Promise<Result<string, string>> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable not set");
    }
    const token = jwt.sign({ role: "admin" }, secret);

    cookies().set("token", token);

    return { success: true, value: token };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error creating token/cookie" };
  }
}
