import { Inter } from "next/font/google";
import { NextIntlClientProvider, useMessages } from "next-intl";
import "./globals.css";
import { getTranslations } from "next-intl/server";
import { UserContextProvider } from "@/context/UserContext";

const inter = Inter({ subsets: ["latin"] });
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      images: [
        {
          url: "/pictures/HFMlogoMetadata.png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

type LocaleProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleProps) {
  const { locale } = await params;
  const messages = useMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <UserContextProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </UserContextProvider>
      </body>
    </html>
  );
}
