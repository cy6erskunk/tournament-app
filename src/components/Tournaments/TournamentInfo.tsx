"use client";
import { useTournamentContext } from "@/context/TournamentContext";
import Leaderboard from "@/components/Leaderboards/Leaderboard";
import LeaderboardSidebar from "@/components/Leaderboards/LeaderboardSidebar";
import ResultsTable from "@/components/Results/ResultsTable";

const TournamentInfo = () => {
  const context = useTournamentContext();
  return (
    <>
      {context.hidden ? (
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          <ResultsTable />
          <LeaderboardSidebar />
        </section>
      ) : (
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          <Leaderboard />
        </section>
      )}
    </>
  );
};

export default TournamentInfo;
