"use client";
import { Player } from "@/types/Player";
import { useTournamentContext } from "@/context/TournamentContext";
import { useEffect, useState } from "react";
import { TrophyIcon } from "@heroicons/react/24/solid";

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

  return (
    <tr className="*:ring-1 *:p-4 *:text-center *:ring-slate-500 odd:bg-white even:bg-blue-50">
      <td className="relative outline outline-1 outline-slate-500">
        <p>{nthRow + 1}</p>
        {/* trophy icons to top 3 */}
        {nthRow < 3 && (
          <div className="absolute inset-y-0 left-6 flex items-center justify-center w-full">
            <TrophyIcon
              className={`w-6 h-6 ${
                nthRow === 0
                  ? "text-yellow-400"
                  : nthRow === 1
                  ? "text-gray-700"
                  : "text-amber-950"
              }`}
            />
          </div>
        )}
      </td>
      <td className="bg-blue-50 font-semibold sticky left-0 z-10 outline outline-1 outline-slate-500">
        {player.player.player_name}
      </td>

      {/* calculate win percentage based on matches associated with player */}
      <td className="bg-blue-100">
        {player.matches.reduce((n, match) => {
          if (match.winner === player.player.player_name) {
            return n + 1;
          }
          return n;
        }, 0)}
      </td>
      <td className="bg-blue-100">{hits.given ?? 0}</td>
      <td className="bg-blue-100">{hits.taken ?? 0}</td>
      <td className="bg-blue-100">{(hits.given ?? 0) - (hits.taken ?? 0)}</td>
    </tr>
  );
}
