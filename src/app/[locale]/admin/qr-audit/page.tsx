import { getTranslations } from "next-intl/server";
import QRAuditLog from "@/components/Admin/QRAuditLog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });

  return {
    title: `${t("title")} - ${t("qrAudit.title")}`,
  };
}

export default async function QRAuditPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <QRAuditLog />
    </div>
  );
}
