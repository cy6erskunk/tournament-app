"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { Player } from "@/types/Player";
import { removeTournamentPlayer } from "@/database/removeTournamentPlayer";
import { useTournamentContext } from "@/context/TournamentContext";
import Rounds from "./rounds";
import { useEffect, useState } from "react";

interface PlayerProps {
  player: Player;
  nthRow: number;
}

function ResultsTable() {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();

  return (
    <div className="w-full md:w-2/3">
      <div className="my-2 text-4xl font-bold flex justify-between">
        <span className={context.loading ? "invisible" : ""}>
          {context.loading ? "Lorem ipsum" : context.tournament?.name}
        </span>
        <Rounds />
      </div>

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

type Hits = {
  given: Record<number, number>;
  taken: Record<number, number>;
};

interface Opponents {
  [key: string]: { winner: string | null; hits: number }[];
}

function ResultPlayer({ player, nthRow }: PlayerProps) {
  const context = useTournamentContext();
  const [hits, setHits] = useState<Hits>({ given: {}, taken: {} });
  const [matchesByOpponent, setOpponents] = useState<Opponents>({});

  async function removePlayer() {
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

      context.setPlayers((prevPlayers) => {
        // Exclude player to be removed from context
        const players = prevPlayers.filter(
          (state) => state.player.player_name !== player.player.player_name,
        );

        // Loop remaining players
        return players.map((p) => {
          // Exclude matches involving removed player
          // keeping ones without the player
          const matches = p.matches.filter(
            (match) =>
              match.player1 !== player.player.player_name &&
              match.player2 !== player.player.player_name,
          );

          return {
            player: p.player,
            matches,
          } as Player;
        });
      });
    }
  }

  useEffect(() => {
    const newHits: Hits = { given: {}, taken: {} };
    const newOpponents: Opponents = {};

    // TODO: Make this look less hideous, currently it's very undreadable
    // for such an important piece of code
    player.matches.forEach((match) => {
      const isPlayer1 = player.player.player_name === match.player1;
      const isPlayer2 = player.player.player_name === match.player2;

      if (isPlayer1 || isPlayer2) {
        const playerHits = isPlayer1 ? match.player1_hits : match.player2_hits;
        const opponentName = isPlayer1 ? match.player2 : match.player1;

        newHits.given[match.round] =
          (newHits.given[match.round] || 0) + playerHits;
        newHits.taken[match.round] =
          (newHits.taken[match.round] || 0) +
          (isPlayer1 ? match.player2_hits : match.player1_hits);

        if (opponentName) {
          if (!newOpponents[opponentName]) {
            newOpponents[opponentName] = [];
          }
          newOpponents[opponentName][match.round] = {
            winner: match.winner,
            hits: playerHits,
          };
        }
      } else {
        console.log(
          `Player ${player.player.player_name} not found in hits info.`,
        );
      }
    });

    setHits(newHits);
    setOpponents(newOpponents);

  }, [context.players, player.matches, player.player]);

  return (
    <tr className="*:ring-1 *:p-4 *:text-center *:ring-slate-500 odd:bg-white even:bg-blue-50">
      <td className="bg-blue-50 font-semibold sticky left-0 z-10 outline outline-1 outline-slate-500">
        {player.player.player_name}
      </td>
      <td>
        <button
          onClick={() => removePlayer()}
          className="bg-red-400 p-1 rounded-full hover:bg-red-500"
        >
          <TrashIcon className="h-5 w-5 text-white" />
        </button>
      </td>
      <td className="bg-blue-500 text-white">{++nthRow}</td>

      {context.players.map((opponent, index) => {
        const key = player.player.player_name + index;
        // Used to set dark bg color if players match, can't play versus self
        const isHighlighted = index + 1 === nthRow;

        const matches = matchesByOpponent[opponent.player.player_name];
        const matchData = matches && matches[context.activeRound];

        // Early return if no match data found between players
        if (!matchData) {
          return (
            <td
              key={key}
              title="Testing"
              className={isHighlighted ? "bg-gray-600" : ""}
            ></td>
          );
        }

        let result = "";
        const { winner, hits } = matchData;

        if (winner === player.player.player_name) {
          result = `V`;
        } else if (winner === opponent.player.player_name) {
          result = `L`;
        }

        result += hits;

        return (
          <td
            key={key}
            title={`${player.player.player_name} vs. ${opponent.player.player_name}`}
            className={
              isHighlighted
                ? "bg-gray-600"
                : "" +
                " underline decoration-dotted cursor-help underline-offset-2"
            }
          >
            {result}
          </td>
        );
      })}

      {/* calculate win percentage based on matches associated with player */}
      <td className="bg-blue-100">
        {player.matches.reduce((n, match) => {
          if (
            match.round === context.activeRound &&
            match.winner === player.player.player_name
          ) {
            return n + 1;
          }
          return n;
        }, 0)}
      </td>
      <td className="bg-blue-100">{hits.given[context.activeRound] ?? 0}</td>
      <td className="bg-blue-100">{hits.taken[context.activeRound] ?? 0}</td>
      <td className="bg-blue-100">
        {(hits.given[context.activeRound] ?? 0) -
          (hits.taken[context.activeRound] ?? 0)}
      </td>
    </tr>
  );
}

function ResultLoading() {
  const context = useTournamentContext();
  const t = useTranslations("Leaderboard");
  return (
    <>
      {context.loading ? (
        <div className="flex row my-24 text-xl justify-center items-center">
          <div className="flex row justify-center items-center gap-2">
            <svg
              aria-hidden="true"
              className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        </div>
      ) : null}
      {!context.players.length && !context.loading ? (
        <div className="flex row my-24 text-xl justify-center items-center">
          {!context.tournament ? (
            <span>{t("noTournament")}</span>
          ) : (
            <span>{t("noPlayers")}</span>
          )}
        </div>
      ) : null}
    </>
  );
}

export default ResultsTable;
