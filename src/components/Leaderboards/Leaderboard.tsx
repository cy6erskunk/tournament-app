"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { Loading } from "@/components/Results/RoundRobin/Loading";
import { useTranslations } from "next-intl";
import { LeaderboardPlayer } from "@/components/Leaderboards/LeaderboardPlayer";
import { useEffect, useState } from "react";
import { Player } from "@/types/Player";
import {
  LeaderboardBuilder,
  LeaderboardColumns,
  SortDirection,
} from "@/helpers/leaderboardSort";

const Leaderboard = () => {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();
  const [players, setPlayers] = useState<Player[]>([]);
  const [sortCol, setSortCol] = useState<LeaderboardColumns>("percentage");
  const [direction, setDirection] = useState<SortDirection>("DEFAULT");

  useEffect(() => {
    const filteredPlayers: Player[] = context.players.filter(
      (player) => player !== null,
    ) as NonNullable<Player>[];
    const p = new LeaderboardBuilder()
      .players(filteredPlayers)
      .direction(direction)
      .column(sortCol)
      .sort();

    setPlayers(p);
  }, [context.players, direction, sortCol]);

  function sortHandler(col: LeaderboardColumns) {
    if (sortCol === col && direction !== "DEFAULT") {
      if (direction === "ASC") {
        return setDirection("DESC");
      }
      setDirection("DEFAULT");
      setSortCol("percentage");
      return;
    }

    setDirection("ASC");
    setSortCol(col);
  }

  function sortIndicator(col: LeaderboardColumns) {
    if (sortCol !== col) return;

    // HTML Character codes for up and down chevron icons
    // https://www.w3schools.com/charsets/ref_utf_arrows.asp
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCharCode
    // U+2191 (↑) = 8593, U+2193 (↓) = 8595
    let dir = undefined;
    if (direction === "ASC") dir = 8593;
    if (direction === "DESC") dir = 8595;

    if (!dir) return;

    return <span>{String.fromCharCode(dir)}</span>;
  }

  return (
    <div className="w-full md:w-2/3">
      <div className="my-2 text-4xl font-bold flex justify-between">
        <span className={context.loading ? "invisible" : ""}>
          {context.loading ? "Lorem ipsum" : context.tournament?.name}
        </span>
      </div>

      <div className="overflow-auto border-2 border-slate-500 rounded-md shadow-md">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="text-white *:py-4 *:bg-blue-500">
              <th className="w-28 min-w-28">{t("position")}</th>
              <th className="w-20 min-w-20" onClick={() => sortHandler("name")}>
                {t("name")}
                {sortIndicator("name")}
              </th>
              <th
                title={t("hoverWin%")}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
                onClick={() => sortHandler("percentage")}
              >
                {t("win%")}
                {sortIndicator("percentage")}
              </th>
              <th
                title={`${t("win")}/${t("loss")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
                onClick={() => sortHandler("wins")}
              >
                {`${t("winShort")}/${t("lossShort")}`}
                {sortIndicator("wins")}
              </th>
              <th
                title={t("hoverHitsGiven")}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
                onClick={() => sortHandler("given")}
              >
                {t("hitsGiven")}
                {sortIndicator("given")}
              </th>
              <th
                title={t("hoverHitsReceived")}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
                onClick={() => sortHandler("taken")}
              >
                {t("hitsReceived")}
                {sortIndicator("taken")}
              </th>
              <th
                title={t("hoverAO-VO")}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
                onClick={() => sortHandler("index")}
              >
                {t("AO-VO")}
                {sortIndicator("index")}
              </th>
            </tr>
          </thead>
          {!context.loading ? (
            <tbody>
              {players.map((player, i) => (
                <LeaderboardPlayer
                  key={player.player.player_name}
                  player={player}
                  nthRow={i}
                />
              ))}
            </tbody>
          ) : null}
        </table>
        <Loading />
      </div>
    </div>
  );
};

export default Leaderboard;
