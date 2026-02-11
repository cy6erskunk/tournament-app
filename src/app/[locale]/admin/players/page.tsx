import { getTranslations } from "next-intl/server";
import PlayerManagement from "@/components/Admin/PlayerManagement";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });

  return {
    title: `${t("title")} - ${t("players.title")}`,
  };
}

export default function PlayersPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <PlayerManagement />
    </div>
  );
}
