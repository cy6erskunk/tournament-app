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

  // While loading, or when the active round can't be identified yet, fall back
  // to a tournament-level check so the page doesn't render blank.
  const showRoundRobin = activeRoundData
    ? activeRoundData.type === "pools"
    : context.rounds.some((r) => r.type === "pools");
  const showBrackets = activeRoundData
    ? activeRoundData.type === "elimination"
    : context.rounds.some((r) => r.type === "elimination");

  if (context.loading) {
    return (
      <section className="container mx-auto p-2">
        <div className="p-4 text-center">Loading tournament information...</div>
      </section>
    );
  }

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
