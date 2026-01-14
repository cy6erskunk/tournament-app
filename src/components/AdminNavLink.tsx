"use client";

import { useUserContext } from "@/context/UserContext";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminNavLink() {
  const account = useUserContext();
  const t = useTranslations("Admin");
  const params = useParams();
  const locale = params.locale as string;

  // Only show link for admin users
  if (account.user?.role !== "admin") {
    return null;
  }

  return (
    <Link
      className="text-white hover:text-blue-900 text-base font-bold py-3 px-5"
      href={`/${locale}/admin`}
    >
      {t("nav.dashboard")}
    </Link>
  );
}
