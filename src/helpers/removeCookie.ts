"use server";

import { cookies } from "next/headers";

export async function removeCookie(name: string) {
  cookies().delete(name);
}
