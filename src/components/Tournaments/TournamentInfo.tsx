"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import Leaderboard from "@/components/Leaderboards/Leaderboard";
import LeaderboardSidebar from "@/components/Leaderboards/LeaderboardSidebar";
import { default as RoundRobin } from "@/components/Results/RoundRobin/Tournament";
import { default as Brackets } from "@/components/Results/Brackets/Tournament";

const TournamentInfo = () => {
  const context = useTournamentContext();
  const activeRoundData = context.rounds.find(
    (r) => r.round_order === context.activeRound,
  );
  const showRoundRobin = activeRoundData?.type === "pools";
  const showBrackets = activeRoundData?.type === "elimination";
  return (
    <>
      {context.hidden ? (
        <>
          {showRoundRobin ? (
            <section className="mx-auto p-2 flex flex-col lg:flex-row justify-center gap-3">
              <RoundRobin />
              <LeaderboardSidebar />
            </section>
          ) : null}

          {showBrackets ? (
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
