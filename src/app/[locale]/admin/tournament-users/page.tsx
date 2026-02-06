import { getTranslations } from "next-intl/server";
import TournamentUsersManagement from "@/components/Admin/TournamentUsersManagement";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });

  return {
    title: `${t("title")} - ${t("tournamentUsers.title")}`,
  };
}

export default function TournamentUsersPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <TournamentUsersManagement />
    </div>
  );
}
