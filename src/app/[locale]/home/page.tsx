import Navbar from "@/components/navbar";
import ResultsTable from "@/components/Results/ResultsTable";
import LeaderboardHome from "@/components/leaderboardHome";
import HomePageButtons from "@/components/homePageButtons";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { TournamentContextProvider } from "@/context/TournamentContext";

const Page = async () => {
  const messages = await getMessages();

  return (
    <>
      <Navbar />
      {/*
      wrap client components in NextIntlClientProvider so we can use
      useTranslations hook in client components
      */}
      <NextIntlClientProvider messages={messages}>
        {/*Style later when everything figured out, desktop view looks bad  */}
        <TournamentContextProvider>
          <HomePageButtons />
          <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
            <ResultsTable />
            <LeaderboardHome />
          </section>
        </TournamentContextProvider>
      </NextIntlClientProvider>
    </>
  );
};

export default Page;
