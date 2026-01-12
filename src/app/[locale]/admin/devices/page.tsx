import { getTranslations } from "next-intl/server";
import DeviceManagement from "@/components/Admin/DeviceManagement";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });

  return {
    title: `${t("title")} - ${t("devices.title")}`,
  };
}

export default function DevicesPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <DeviceManagement />
    </div>
  );
}
