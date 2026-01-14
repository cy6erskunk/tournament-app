"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Result } from "@/types/result";

// NOTE:
// jsonwebtoken docs https://www.npmjs.com/package/jsonwebtoken

export async function addCookie(
  name: string,
  role: string,
): Promise<Result<string, string>> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable not set");
    }

    const user = {
      name: name,
      role: role,
    };

    const token = jwt.sign(user, secret, { expiresIn: "8h" }); // expires in 8 hours

    // Use VERCEL_ENV on Vercel (production/preview/development), fallback to NODE_ENV for local
    const isProduction = process.env.VERCEL_ENV === 'production' || 
                        (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV);

    (await cookies()).set("token", token, {
      httpOnly: true,    // Prevent JavaScript access
      secure: isProduction, // HTTPS only in production
      sameSite: 'lax', // CSRF protection while allowing top-level navigation
      maxAge: 8 * 60 * 60, // 8 hours (in seconds)
      path: '/'
    });

    return { success: true, value: token };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error creating token/cookie" };
  }
}
