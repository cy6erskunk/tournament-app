import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import { getTranslations, getMessages } from "next-intl/server";
import { UserContextProvider } from "@/context/UserContext";
import { getSession } from "@/helpers/getsession";

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
  const messages = await getMessages();

  // Fetch user session on the server to avoid client-side delay
  const session = await getSession();
  const initialUser = session.success ? session.value : null;

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <UserContextProvider initialUser={initialUser}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </UserContextProvider>
      </body>
    </html>
  );
}
