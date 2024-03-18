"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { getTournamentToday } from "@/database/addMatch";
import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { Player } from "@/types/Player";
import { removeTournamentPlayer } from "@/database/removeTournamentPlayer";
import { useTournamentContext } from "@/context/TournamentContext";

interface PlayerProps {
  player: Player;
  nthRow: number;
  removePlayer: Function;
}

function ResultsTable() {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();

  async function removePlayer(player: Player) {
    if (window.confirm(`Remove ${player.player.player_name}?`)) {
      const result = await removeTournamentPlayer(
        player.player.tournament_id,
        player.player.player_name,
      );

      if (!result.success) {
        const userAgrees = window.confirm(
          "Could not delete user from database, delete anyway?",
        );
        if (!userAgrees) return;
      }

      const filteredPlayers = context.players.filter(
        (state) => state.player.player_name !== player.player.player_name,
      );
      context.setPlayers(filteredPlayers);
    }
  }

  return (
    <div className="w-full md:w-2/3">
      <div className="overflow-auto max-h-[500px] border-2 border-slate-500 rounded-md shadow-md">
        <table className="table-auto w-full">
          <thead>
            <tr className="text-white *:py-4 *:sticky *:top-0 *:bg-blue-500 *:z-20 *:outline *:outline-1 *:outline-blue-500">
              <th>{t("name")}</th>
              <th>{t("remove")}</th>
              <th title="Id">#</th>
              {/* map through players and set <th>{player id}</th> */}
              {context.players.map((player, index) => (
                <th key={player.player.player_name}>{index + 1}</th>
              ))}
              <th
                title={`${t("hoverWin%")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("win%")}
              </th>
              <th
                title={`${t("hoverHitsGiven")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("hitsGiven")}
              </th>
              <th
                title={`${t("hoverHitsReceived")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("hitsReceived")}
              </th>
              <th
                title={`${t("hoverAO-VO")}`}
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                {t("AO-VO")}
              </th>
            </tr>
          </thead>
          <tbody>
            {context.players.map((player, i) => (
              <ResultPlayer
                key={player.player.player_name}
                player={player}
                nthRow={i}
                removePlayer={removePlayer}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultPlayer({ player, nthRow, removePlayer }: PlayerProps) {
  const context = useTournamentContext();

  return (
    <tr
      className="*:ring-1 *:p-4 *:text-center *:ring-slate-500 odd:bg-white even:bg-blue-50"
    >
      <td className="bg-blue-50 font-semibold sticky left-0 z-10 outline outline-1 outline-slate-500">
        {player.player.player_name}
      </td>
      <td>
        <button
          onClick={() => removePlayer(player)}
          className="bg-red-400 p-1 rounded-full hover:bg-red-500"
        >
          <TrashIcon className="h-5 w-5 text-white" />
        </button>
      </td>
      <td className="bg-blue-500 text-white">{++nthRow}</td>

      {/* round results here. Now hard coded 'V' */}
      {/* set darker bg color if player index same because can't play versus itself */}
      {context.players.map((_, i) => (
        <td
          key={player.player.player_name + ++i}
          className={++i === nthRow ? "bg-gray-600" : ""}
        >
          {/* Mark everything as win for now */}
          {i !== nthRow ? "W" : ""}
        </td>
      ))}

      {/* calculate win percentage based on matches associated with player */}
      <td className="bg-blue-100">
        {player.matches.reduce(
          (n, match) =>
            match.winner === player.player.player_name ? n + 1 : n,
          0,
        )}
      </td>
      <td className="bg-blue-100">{player.player.hits_given}</td>
      <td className="bg-blue-100">{player.player.hits_received}</td>
      <td className="bg-blue-100">
        {player.player.hits_given - player.player.hits_received}
      </td>
    </tr>
  );
}

export default ResultsTable;
