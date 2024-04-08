import bcrypt from "bcrypt"
import type { Result } from "@/types/result"

export async function passwordHash(password: string): Promise<Result<string, string>> {
  try {
    const hash = await bcrypt.hash(password, 10)
    return { success: true, value: hash }
  } catch (e) {
    console.log(e)
    if (e instanceof Error) return { success: false, error: e.message }
    return { success: false, error: "Unknown error occurred while hashing password" }
  }
}

export async function passwordCheck(password: string, hash: string): Promise<Result<boolean, string>> {
  try {
    const match = await bcrypt.compare(password, hash)
    if (!match) return { success: false, error: "Passwords did not match" }
    return { success: true, value: match }
  } catch (e) {
    console.log(e)
    if (e instanceof Error) return { success: false, error: e.message }
    return { success: false, error: "Unknown error occurred while comparing passwords" }
  }
}
