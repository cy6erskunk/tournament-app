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
        <section className="container mx-auto p-2 flex flex-col md:flex-row gap-3 *:grow">
          {context.tournament?.format === "Round Robin" ? (
            <div>
              <RoundRobin />
              <LeaderboardSidebar />
            </div>
          ) : null}

          {context.tournament?.format === "Brackets" ? (
            <>
              <Brackets />
            </>
          ) : null}
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
