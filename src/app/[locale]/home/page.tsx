import Navbar from "@/components/navbar";
import ResultsTable from "@/components/resultsTable";
import LeaderboardHome from "@/components/leaderboardHome";
import HomePageButtons from "@/components/homePageButtons";
import { NextIntlClientProvider, useMessages } from "next-intl";

const Page = () => {
  const messages = useMessages();
  return (
    <>
      <Navbar />
      {/* 
      wrap client components in NextIntlClientProvider so we can use
      useTranslations hook in client components
      */}
      <NextIntlClientProvider messages={messages}>
        {/*Style later when everything figured out, desktop view looks bad  */}
        <HomePageButtons />
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          <ResultsTable />
          <LeaderboardHome />
        </section>
      </NextIntlClientProvider>
    </>
  );
};

export default Page;
