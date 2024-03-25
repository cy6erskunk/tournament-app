"use client";
import { useTournamentContext } from "@/context/TournamentContext";
import Leaderboard from "@/components/Leaderboards/Leaderboard";
import LeaderboardHome from "@/components/leaderboardHome";
import ResultsTable from "@/components/Results/ResultsTable";

const HomePageInfo = () => {
  const context = useTournamentContext();
  return (
    <>
      {context.hidden ? (
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          <ResultsTable />
          <LeaderboardHome />
        </section>
      ) : (
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          <Leaderboard />
        </section>
      )}
    </>
  );
};

export default HomePageInfo;
