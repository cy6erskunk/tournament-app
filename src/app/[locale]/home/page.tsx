import Navbar from "@/components/navbar";
import ResultsTable from "@/components/resultsTable";
import LeaderboardHome from "@/components/leaderboardHome";
import HomePageButtons from "@/components/homePageButtons";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getTournamentToday } from "@/database/addMatch";
import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { TournamentPlayers } from "@/database/types";

const fetchTournamentPlayers = async () => {
  const currentDate = new Date();
  const tournament = await getTournamentToday(currentDate);
  if (tournament) {
    return await getTournamentPlayers(tournament.id);
  }
  return [];
};

const Page = async () => {
  const messages = await getMessages();
  const tournamentPlayers: TournamentPlayers[] = await fetchTournamentPlayers();

  return (
    <>
      <Navbar />
      {/* 
      wrap client components in NextIntlClientProvider so we can use
      useTranslations hook in client components
      */}
      <NextIntlClientProvider messages={messages}>
        {/*Style later when everything figured out, desktop view looks bad  */}
        <HomePageButtons tournamentPlayers={tournamentPlayers} />
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          <ResultsTable />
          <LeaderboardHome />
        </section>
      </NextIntlClientProvider>
    </>
  );
};

export default Page;
