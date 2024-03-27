"use client";

import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import Rounds from "@/components/rounds";
import { ResultLoading } from "./ResultLoading";
import { ResultPlayer } from "./ResultPlayer";

function ResultsTable() {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();

  return (
    <div className="w-full md:w-2/3">
      <div className="sm:my-2 items-center text-xl sm:text-4xl font-bold flex justify-between">
        <span className={context.loading ? "invisible" : ""}>
          {context.loading ? "Lorem ipsum" : context.tournament?.name}
        </span>
        <Rounds />
      </div>

      <div className="overflow-auto max-h-[500px] border-2 border-slate-500 rounded-md shadow-md">
        <table className="w-full">
          <thead>
            <tr
              className={`${
                context.activeRound === 1 ? "*:bg-blue-500" : "*:bg-violet-500"
              } text-white *:py-4 *:sticky *:top-0 *:z-20 *:transition-all *:duration-300 *:ease-in-out`}
            >
              <th className="w-20 min-w-20">{t("name")}</th>
              <th className="w-20 min-w-20">{t("remove")}</th>
              <th className="w-20 min-w-20" title="Id">
                #
              </th>
              {/* map through players and set <th>{player id}</th> */}
              {context.players.map((player, index) => (
                <th className="w-20 min-w-20" key={player.player.player_name}>
                  {index + 1}
                </th>
              ))}
              <th
                title={`${t("hoverWin%")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("win%")}
              </th>
              <th
                title={`${t("hoverHitsGiven")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("hitsGiven")}
              </th>
              <th
                title={`${t("hoverHitsReceived")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("hitsReceived")}
              </th>
              <th
                title={`${t("hoverAO-VO")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("AO-VO")}
              </th>
            </tr>
          </thead>
          {!context.loading ? (
            <tbody>
              {context.players.map((player, i) => (
                <ResultPlayer
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
}

export default ResultsTable;
