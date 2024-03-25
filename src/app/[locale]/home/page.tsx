import Navbar from "@/components/navbar";
import ResultsTable from "@/components/Results/ResultsTable";
import LeaderboardHome from "@/components/leaderboardHome";
import HomePageButtons from "@/components/homePageButtons";
import { TournamentContextProvider } from "@/context/TournamentContext";

const Page = async () => {

  return (
    <>
      <Navbar />
        {/*Style later when everything figured out, desktop view looks bad  */}
        <TournamentContextProvider>
          <HomePageButtons />
          <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
            <ResultsTable />
            <LeaderboardHome />
          </section>
        </TournamentContextProvider>
    </>
  );
};

export default Page;
