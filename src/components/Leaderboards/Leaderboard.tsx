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

interface SortButtonProps {
  col: LeaderboardColumns;
  onSort: (col: LeaderboardColumns) => void;
  ariaLabel: string;
  tooltip?: boolean;
  children: React.ReactNode;
}

function SortButton({ col, onSort, ariaLabel, tooltip, children }: SortButtonProps) {
  return (
    <button
      type="button"
      className={`${tooltip ? "underline decoration-dotted cursor-help underline-offset-2 " : ""}text-white w-full`}
      onClick={() => onSort(col)}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

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
                <SortButton col="name" onSort={sortHandler} ariaLabel={getAriaLabel(sortCol, "name", t("name"))}>
                  {t("name")}{sortIndicator("name")}
                </SortButton>
              </th>
              <th title={t("hoverWin%")} className="w-20 min-w-20">
                <SortButton tooltip col="percentage" onSort={sortHandler} ariaLabel={getAriaLabel(sortCol, "percentage", t("win%"))}>
                  {t("win%")}{sortIndicator("percentage")}
                </SortButton>
              </th>
              <th title={`${t("win")}/${t("loss")}`} className="w-20 min-w-20">
                <SortButton tooltip col="wins" onSort={sortHandler} ariaLabel={getAriaLabel(sortCol, "wins", `${t("winShort")}/${t("lossShort")}`)}>
                  {`${t("winShort")}/${t("lossShort")}`}{sortIndicator("wins")}
                </SortButton>
              </th>
              <th title={t("hoverHitsGiven")} className="w-20 min-w-20">
                <SortButton tooltip col="given" onSort={sortHandler} ariaLabel={getAriaLabel(sortCol, "given", t("hitsGiven"))}>
                  {t("hitsGiven")}{sortIndicator("given")}
                </SortButton>
              </th>
              <th title={t("hoverHitsReceived")} className="w-20 min-w-20">
                <SortButton tooltip col="taken" onSort={sortHandler} ariaLabel={getAriaLabel(sortCol, "taken", t("hitsReceived"))}>
                  {t("hitsReceived")}{sortIndicator("taken")}
                </SortButton>
              </th>
              <th title={t("hoverAO-VO")} className="w-20 min-w-20">
                <SortButton tooltip col="index" onSort={sortHandler} ariaLabel={getAriaLabel(sortCol, "index", t("AO-VO"))}>
                  {t("AO-VO")}{sortIndicator("index")}
                </SortButton>
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
