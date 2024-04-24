"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { LeaderboardBuilder } from "@/helpers/leaderboardSort";
import { Player } from "@/types/Player";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const LeaderboardSidebar = () => {
  // linear gradient doesn't work with iphone / safari
  // const getRowBgColor = (index: number) => {
  //   if (index === 0) return "bg-gradient-to-r from-yellow-50 to-yellow-200";
  //   if (index === 1) return "bg-gradient-to-r from-gray-50 to-gray-300";
  //   if (index === 2) return "bg-gradient-to-r from-amber-50 to-amber-300";
  //   return "odd:bg-white even:bg-gray-50";
  // };
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const p = new LeaderboardBuilder()
      .players([...context.players])
      .ascending()
      .column("wins")
      .sort()
    setPlayers(p);
  }, [context.players]);

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
            // linear gradient doesn't work with iphone / safari.
            // className={`*:text-center *:py-4 ${getRowBgColor(index)}`}
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
