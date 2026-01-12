import { getTranslations } from "next-intl/server";
import UserManagement from "@/components/Admin/UserManagement";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });

  return {
    title: `${t("title")} - ${t("users.title")}`,
  };
}

export default function UsersPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <UserManagement />
    </div>
  );
}
