"use client";

import { Player } from "@/types/Player";
import { useTournamentContext } from "@/context/TournamentContext";
import { useEffect, useState } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";
import winPercentage, { wins } from "@/helpers/winPercentage";
import { useTranslations } from "next-intl";

interface PlayerProps {
  player: Player;
  nthRow: number;
}

type Hits = {
  given: number;
  taken: number;
};

export function LeaderboardPlayer({ player, nthRow }: PlayerProps) {
  const context = useTournamentContext();
  const [hits, setHits] = useState<Hits>({ given: 0, taken: 0 });
  const t = useTranslations("Leaderboard");

  useEffect(() => {
    const newHits: Hits = { given: 0, taken: 0 };

    // TODO: Make this look less hideous, currently it's very undreadable
    // for such an important piece of code
    player.matches.forEach((match) => {
      const isPlayer1 = player.player.player_name === match.player1;
      const isPlayer2 = player.player.player_name === match.player2;

      if (isPlayer1 || isPlayer2) {
        const playerHits = isPlayer1 ? match.player1_hits : match.player2_hits;

        newHits.given = (newHits.given || 0) + playerHits;
        newHits.taken =
          (newHits.taken || 0) +
          (isPlayer1 ? match.player2_hits : match.player1_hits);
      }
    });

    setHits(newHits);
  }, [context.players, player.matches, player.player]);

  function getMatchData(player: Player): [number, number] {
    const wins = player.matches.filter(
      (match) => match.winner === player.player.player_name,
    ).length;
    const losses = player.matches.length - wins;
    return [wins, losses];
  }

  function matchData(player: Player) {
    const data = getMatchData(player);
    return <>{`${data[0]}${t("winShort")} ${data[1]}${t("lossShort")}`}</>;
  }

  return (
    <tr className="*:p-4 *:text-center odd:bg-white even:bg-blue-50 *:border *:border-slate-400">
      <td className="relative">
        <p>{nthRow + 1}.</p>
        {/* trophy icons to top 3 */}
        {nthRow < 3 && (
          <div className="absolute inset-y-0 left-6 flex items-center justify-center w-full">
            <TrophyIcon
              className={`w-6 h-6 ${nthRow === 0
                  ? "text-yellow-400"
                  : nthRow === 1
                    ? "text-gray-700"
                    : "text-amber-950"
                }`}
            />
          </div>
        )}
      </td>
      <td className="font-semibold">{player.player.player_name}</td>

      {/* calculate win percentage based on matches associated with player */}
      <td>{winPercentage(player).toFixed(0) + "%"}</td>
      <td>{matchData(player)}</td>
      <td className="bg-blue-50">{hits.given ?? 0}</td>
      <td className="bg-blue-50">{hits.taken ?? 0}</td>
      <td className="bg-blue-50">{(hits.given ?? 0) - (hits.taken ?? 0)}</td>
    </tr>
  );
}
