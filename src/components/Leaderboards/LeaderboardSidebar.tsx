"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { LeaderboardBuilder } from "@/helpers/leaderboardSort";
import { Player } from "@/types/Player";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

const LeaderboardSidebar = () => {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();

  const players = useMemo(() => {
    const filteredPlayers: Player[] = context.players.filter((player) => player !== null) as NonNullable<Player>[]
    return new LeaderboardBuilder()
      .players(filteredPlayers)
      .round(context.activeRound)
      .ascending()
      .column("percentage")
      .sort();
  }, [context.activeRound, context.players]);

  return (
    <div className="lg:max-w-sm lg:w-1/5 border-2 rounded-md shadow-md border-gray-400">
      <table className="table-auto w-full">
        <thead>
          <tr className="text-white *:py-4 bg-gray-400">
            <th>{t("position")}</th>
            <th>{t("name")}</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr
              key={index}
              className="*:text-center *:py-4 odd:bg-white even:bg-gray-100"
            >
              <td className="relative">
                <p>{index + 1}.</p>
                {/* trophy icons to top 3 */}
                {index < 3 && (
                  <div className="absolute inset-y-0 left-6 flex items-center justify-center w-full">
                    <TrophyIcon
                      className={`w-6 h-6 ${index === 0
                        ? "text-yellow-400"
                        : index === 1
                          ? "text-gray-700"
                          : "text-amber-950"
                        }`}
                    />
                  </div>
                )}
              </td>
              <td>{player.player.player_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardSidebar;
