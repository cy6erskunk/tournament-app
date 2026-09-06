"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { LeaderboardBuilder } from "@/helpers/leaderboardSort";
import { Player } from "@/types/Player";
import { PoolRow } from "@/database/getPools";
import { TrophyIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface PlayerRowProps {
  player: Player;
  index: number;
}

function PlayerRow({ player, index }: PlayerRowProps) {
  return (
    <tr className="*:text-center *:py-4 odd:bg-white even:bg-gray-100">
      <td className="relative">
        <p>{index + 1}.</p>
        {index < 3 && (
          <div className="absolute inset-y-0 left-6 flex items-center justify-center w-full">
            <TrophyIcon
              className={`w-6 h-6 ${
                index === 0
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
  );
}

interface PoolSectionProps {
  pool: PoolRow;
  players: Player[];
  activeRoundId: number | null;
}

function PoolSection({ pool, players, activeRoundId }: PoolSectionProps) {
  const sorted = new LeaderboardBuilder()
    .players(players)
    .round(activeRoundId)
    .ascending()
    .column("percentage")
    .sort();

  return (
    <>
      <tr className="bg-gray-200">
        <td colSpan={2} className="py-2 px-4 font-semibold text-slate-700 text-sm">
          {pool.name}
        </td>
      </tr>
      {sorted.map((player, index) => (
        <PlayerRow key={player.player.player_name} player={player} index={index} />
      ))}
    </>
  );
}

const LeaderboardSidebar = () => {
  const t = useTranslations("Leaderboard");
  const tPool = useTranslations("Pool");
  const context = useTournamentContext();

  const activeRoundId = useMemo(
    () =>
      context.rounds.find((r) => r.round_order === context.activeRound)?.id ??
      null,
    [context.rounds, context.activeRound],
  );

  const allPlayers = useMemo(
    () =>
      context.players.filter((player) => player !== null) as NonNullable<Player>[],
    [context.players],
  );

  const multiplePools = context.pools.length > 1;

  const unassignedPlayers = useMemo(
    () => (multiplePools ? allPlayers.filter((p) => p.player.pool_id === null) : []),
    [allPlayers, multiplePools],
  );

  const sortedPlayers = useMemo(() => {
    if (multiplePools) return [];
    return new LeaderboardBuilder()
      .players(allPlayers)
      .round(activeRoundId)
      .ascending()
      .column("percentage")
      .sort();
  }, [allPlayers, activeRoundId, multiplePools]);

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
          {multiplePools
            ? (
              <>
                {context.pools.map((pool) => (
                  <PoolSection
                    key={pool.id}
                    pool={pool}
                    players={allPlayers.filter((p) => p.player.pool_id === pool.id)}
                    activeRoundId={activeRoundId}
                  />
                ))}
                {unassignedPlayers.length > 0 && (
                  <PoolSection
                    pool={{ id: -1, tournament_id: -1, name: tPool("unassigned") }}
                    players={unassignedPlayers}
                    activeRoundId={activeRoundId}
                  />
                )}
              </>
            )
            : sortedPlayers.map((player, index) => (
                <PlayerRow
                  key={player.player.player_name}
                  player={player}
                  index={index}
                />
              ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardSidebar;
