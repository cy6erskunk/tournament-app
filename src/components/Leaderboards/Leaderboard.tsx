"use client";
import { useTournamentContext } from "@/context/TournamentContext";
import { ResultLoading } from "@/components/Results/ResultLoading";
import { useTranslations } from "next-intl";
import { LeaderboardPlayer } from "@/components/Leaderboards/LeaderboardPlayer";
import { useEffect, useState } from "react";
import { Player } from "@/types/Player";

const Leaderboard = () => {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const p = [...context.players].sort((a, b) => {
      const winsA = a.matches.reduce((count, match) => {
        if (match.winner !== a.player.player_name) return count;
        return count + 1;
      }, 0);

      const winsB = b.matches.reduce((count, match) => {
        if (match.winner !== b.player.player_name) return count;
        return count + 1;
      }, 0);

      return winsB - winsA;
    });
    setPlayers(p);
  }, [context.players]);

  return (
    <div className="w-full md:w-2/3">
      <div className="my-2 text-4xl font-bold flex justify-between">
        <span className={context.loading ? "invisible" : ""}>
          {context.loading ? "Lorem ipsum" : context.tournament?.name}
        </span>
      </div>

      <div className="overflow-auto max-h-[500px] border-2 border-slate-500 rounded-md shadow-md">
        <table className="table-auto w-full">
          <thead>
            <tr className="text-white *:py-4 *:sticky *:top-0 *:bg-blue-500 *:z-20 *:outline *:outline-1 *:outline-blue-500">
              <th>{t("position")}</th>
              <th>{t("name")}</th>
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
        <ResultLoading />
      </div>
    </div>
  );
};

export default Leaderboard;
