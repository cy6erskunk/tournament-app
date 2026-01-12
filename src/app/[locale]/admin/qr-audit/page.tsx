import { getTranslations } from "next-intl/server";

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

export default async function QRAuditPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.qrAudit" });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {t("pageDescription")}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            {t("comingSoon")}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t("comingSoonDescription")}
          </p>
          <div className="mt-6">
            <div className="text-left max-w-lg mx-auto">
              <p className="text-sm text-gray-600 mb-2">{t("plannedFeatures")}</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>{t("feature1")}</li>
                <li>{t("feature2")}</li>
                <li>{t("feature3")}</li>
                <li>{t("feature4")}</li>
                <li>{t("feature5")}</li>
                <li>{t("feature6")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
