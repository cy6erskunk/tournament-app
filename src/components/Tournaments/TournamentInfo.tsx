"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import Leaderboard from "@/components/Leaderboards/Leaderboard";
import LeaderboardSidebar from "@/components/Leaderboards/LeaderboardSidebar";
import { default as RoundRobin } from "@/components/Results/RoundRobin/Tournament";
import { default as Brackets } from "@/components/Results/Brackets/Tournament";

const TournamentInfo = () => {
  const context = useTournamentContext();
  return (
    <>
      {context.hidden ? (
        <>
          {context.tournament?.format === "Round Robin" ? (
            <section className="container mx-auto p-2 flex flex-col lg:flex-row gap-3 *:grow">
              <RoundRobin />
              <LeaderboardSidebar />
            </section>
          ) : null}

          {context.tournament?.format === "Brackets" ? (
            <section className="p-2">
              <Brackets />
            </section>
          ) : null}
        </>
      ) : (
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          <Leaderboard />
        </section>
      )}
    </>
  );
};

export default TournamentInfo;
