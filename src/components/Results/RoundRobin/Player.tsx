import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Player } from "@/types/Player";
import { removeTournamentPlayer } from "@/database/removeTournamentPlayer";
import { useTournamentContext } from "@/context/TournamentContext";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useUserContext } from "@/context/UserContext";

interface PlayerProps {
  player: Player;
  nthRow: number;
  openModal: (player: Player, opponent?: Player) => void;
  openEditModal: (player: Player, opponent: Player) => void;
}

type Hits = {
  given: Record<number, number>;
  taken: Record<number, number>;
};

interface Opponents {
  [key: string]: { winner: string | null; hits: number }[];
}

export function Player({ player, nthRow, openModal, openEditModal }: PlayerProps) {
  const context = useTournamentContext();
  const account = useUserContext();
  const [hits, setHits] = useState<Hits>({ given: {}, taken: {} });
  const [matchesByOpponent, setOpponents] = useState<Opponents>({});
  const t = useTranslations("Leaderboard");

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

  const getRemovePlayerButton = () => {
    if (!account.user) return;
    if (account.user.role !== "admin") return;

    return (
      <td>
        <button
          onClick={() => removePlayer()}
          className="bg-red-400 p-1 rounded-full hover:bg-red-500"
        >
          <TrashIcon className="h-5 w-5 text-white" />
        </button>
      </td>
    );
  };

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
    <tr
      className={`${
        context.activeRound === 1
          ? "odd:bg-white even:bg-blue-50"
          : "odd:bg-white even:bg-violet-50"
      } *:ring-1 *:p-4 *:text-center *:ring-slate-500`}
    >
      <td
        className={`${
          context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
        } font-semibold sticky left-0 z-10 outline outline-1 outline-slate-500`}
      >
        {player.player.player_name}
      </td>
      <td>
        <button onClick={() => openModal(player)}>
          <PlusCircleIcon className="h-8 w-8 text-blue-700" />
        </button>
      </td>
      {getRemovePlayerButton()}
      <td
        className={`${
          context.activeRound === 1 ? "bg-blue-500" : "bg-violet-500"
        } transition-all duration-300 ease-in-out text-white`}
      >
        {++nthRow}
      </td>

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
              className={isHighlighted ? "bg-gray-600" : "group"}
              onClick={() => !isHighlighted && openModal(player, opponent)}
              key={key}
            >
              <button className="invisible group-hover:visible">
                <PlusCircleIcon className="h-8 w-8 text-blue-700" />
              </button>
            </td>
          );
        }

        let result = "";
        const { winner, hits } = matchData;

        if (winner === player.player.player_name) {
          result = t("winShort");
        } else if (winner === opponent.player.player_name) {
          result = t("lossShort");
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
            onClick={() => openEditModal(player, opponent)}
          >
            {result}
          </td>
        );
      })}

      {/* calculate win percentage based on matches associated with player */}
      <td
        className={`${
          context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
        }`}
      >
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
      <td
        className={`${
          context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
        }`}
      >
        {hits.given[context.activeRound] ?? 0}
      </td>
      <td
        className={`${
          context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
        }`}
      >
        {hits.taken[context.activeRound] ?? 0}
      </td>
      <td
        className={`${
          context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
        }`}
      >
        {(hits.given[context.activeRound] ?? 0) -
          (hits.taken[context.activeRound] ?? 0)}
      </td>
    </tr>
  );
}
