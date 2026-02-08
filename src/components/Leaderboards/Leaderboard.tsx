"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { Loading } from "@/components/Results/RoundRobin/Loading";
import { useTranslations } from "next-intl";
import { LeaderboardPlayer } from "@/components/Leaderboards/LeaderboardPlayer";
import { useMemo, useState } from "react";
import { Player } from "@/types/Player";
import {
  LeaderboardBuilder,
  LeaderboardColumns,
  SortDirection,
} from "@/helpers/leaderboardSort";

const Leaderboard = () => {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();
  const [sortCol, setSortCol] = useState<LeaderboardColumns>("percentage");
  const [direction, setDirection] = useState<SortDirection>("DEFAULT");

  const players = useMemo(() => {
    const filteredPlayers: Player[] = context.players.filter(
      (player) => player !== null,
    ) as NonNullable<Player>[];
    return new LeaderboardBuilder()
      .players(filteredPlayers)
      .direction(direction)
      .column(sortCol)
      .sort();
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

    if (direction === "ASC") return <span>↑</span>;
    if (direction === "DESC") return <span>↓</span>;
  }

  function getAriaLabel(sortCol: LeaderboardColumns, col: LeaderboardColumns, label: string) {
    if (sortCol === col && direction !== "DEFAULT") {
      return `${label}, ${direction === "ASC" ? t("sortAscending") : t("sortDescending")}`;
    }
    return label;
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
              <th className="w-20 min-w-20">
                <button type="button" className="text-white" onClick={() => sortHandler("name")} aria-label={getAriaLabel(sortCol, "name", t("name"))}>
                  {t("name")}
                  {sortIndicator("name")}
                </button>
              </th>
              <th
                title={t("hoverWin%")}
                className="w-20 min-w-20"
              >
                <button type="button" className="underline decoration-dotted cursor-help underline-offset-2 text-white" onClick={() => sortHandler("percentage")} aria-label={getAriaLabel(sortCol, "percentage", t("win%"))}>
                  {t("win%")}
                  {sortIndicator("percentage")}
                </button>
              </th>
              <th
                title={`${t("win")}/${t("loss")}`}
                className="w-20 min-w-20"
              >
                <button type="button" className="underline decoration-dotted cursor-help underline-offset-2 text-white" onClick={() => sortHandler("wins")} aria-label={getAriaLabel(sortCol, "wins", `${t("winShort")}/${t("lossShort")}`)}>
                  {`${t("winShort")}/${t("lossShort")}`}
                  {sortIndicator("wins")}
                </button>
              </th>
              <th
                title={t("hoverHitsGiven")}
                className="w-20 min-w-20"
              >
                <button type="button" className="underline decoration-dotted cursor-help underline-offset-2 text-white" onClick={() => sortHandler("given")} aria-label={getAriaLabel(sortCol, "given", t("hitsGiven"))}>
                  {t("hitsGiven")}
                  {sortIndicator("given")}
                </button>
              </th>
              <th
                title={t("hoverHitsReceived")}
                className="w-20 min-w-20"
              >
                <button type="button" className="underline decoration-dotted cursor-help underline-offset-2 text-white" onClick={() => sortHandler("taken")} aria-label={getAriaLabel(sortCol, "taken", t("hitsReceived"))}>
                  {t("hitsReceived")}
                  {sortIndicator("taken")}
                </button>
              </th>
              <th
                title={t("hoverAO-VO")}
                className="w-20 min-w-20"
              >
                <button type="button" className="underline decoration-dotted cursor-help underline-offset-2 text-white" onClick={() => sortHandler("index")} aria-label={getAriaLabel(sortCol, "index", t("AO-VO"))}>
                  {t("AO-VO")}
                  {sortIndicator("index")}
                </button>
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
