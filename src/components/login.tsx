"use client";
import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";
import { userLogin } from "../database/userLogin";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/UserContext";
import { getSession } from "@/helpers/getsession";
import { removeCookie } from "@/helpers/removeCookie";

export default function Login() {
  const account = useUserContext();
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Login");
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const session = await getSession();
      if (session.success) {
        router.push("/select");
        return;
      }
      await removeCookie("token");
    }
    checkSession();
  }, [router]);

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name")?.toString();
    const password = formData.get("password")?.toString();
    if (!name || !password) {
      console.log("Error: " + "Name or password is empty");
      setLoading(false);
      return;
    }

    const status = await userLogin(name, password);

    if (!status.success) {
      console.log("Error: " + status.error);
      setLoading(false);
      alert("Wrong username or password");
      return;
    }

    account.setUser(status.value);
    router.push("/select");
  };

  return (
    <form className="space-y-6" onSubmit={submitForm}>
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          {t("name")}
        </label>
        <div className="mt-2">
          <input
            id="name"
            name="name"
            type="text"
            required
            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            {t("password")}
          </label>
        </div>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            required
            className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
        </div>
      </div>
      <div>
        <button
          disabled={loading}
          type="submit"
          className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
        >
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
