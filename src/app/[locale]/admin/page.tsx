import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });

  return {
    title: t("title"),
  };
}

export default async function AdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin" });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-semibold text-gray-900">
            {t("dashboard.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {t("dashboard.description")}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/admin/users`}
          className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium text-gray-900">
                {t("users.title")}
              </p>
              <p className="text-sm text-gray-500">
                {t("users.description")}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/admin/devices`}
          className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium text-gray-900">
                {t("devices.title")}
              </p>
              <p className="text-sm text-gray-500">
                {t("devices.description")}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/admin/qr-audit`}
          className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-gray-600"
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
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium text-gray-900">
                {t("qrAudit.title")}
              </p>
              <p className="text-sm text-gray-500">
                {t("qrAudit.description")}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href={`/admin/tournament-users`}
          className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium text-gray-900">
                {t("tournamentUsers.title")}
              </p>
              <p className="text-sm text-gray-500">
                {t("tournamentUsers.description")}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
