"use server";

import { cookies } from "next/headers";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Result } from "@/types/result";

// NOTE:
// jsonwebtoken docs https://www.npmjs.com/package/jsonwebtoken

export async function getSession(): Promise<Result<undefined, string>> {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get("token");

    if (!cookie) {
      return { success: false, error: "Error with cookie" };
    }

    const token = cookie.value;

    if (!token) {
      return { success: false, error: "Error with token" };
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable not set");
    }
    const verifyToken = jwt.verify(token, secret) as JwtPayload;

    if (!verifyToken) {
      return { success: false, error: "Error with token" };
    }

    if (!verifyToken.role || verifyToken.role !== "admin") {
      return { success: false, error: "Error with role" };
    }

    return { success: true, value: undefined };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error getting session" };
  }
}
