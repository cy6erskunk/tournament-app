"use server";

import { cookies } from "next/headers";

export async function removeCookie(name: string) {
  (await cookies()).delete(name);
}
