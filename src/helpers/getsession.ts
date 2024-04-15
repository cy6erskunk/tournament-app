"use server";

import { cookies } from "next/headers";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { Result } from "@/types/result";
import { UserAccountInfo } from "@/context/UserContext";

// NOTE:
// jsonwebtoken docs https://www.npmjs.com/package/jsonwebtoken

export async function getSession(): Promise<Result<UserAccountInfo, string>> {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get("token");

    if (!cookie) {
      return { success: false, error: "No cookie found" };
    }

    const token = cookie.value;

    if (!token) {
      return { success: false, error: `No cookie with name "token" found` };
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

    const userToken: UserAccountInfo = {
      name: verifyToken.name,
      role: verifyToken.role,
    };

    return { success: true, value: userToken };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.log(error.name);
      return { success: false, error: error.name };
    }
    return { success: false, error: "Error getting session" };
  }
}
