import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { Player } from "@/types/Player";
import { removeTournamentPlayer } from "@/database/removeTournamentPlayer";
import { useTournamentContext } from "@/context/TournamentContext";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useUserContext } from "@/context/UserContext";

interface PlayerProps {
  player: Player;
  nthRow: number;
  openModal: (player: Player, opponent?: Player) => void;
  openEditModal: (player: Player, opponent: Player) => void;
  /** When provided, only these players are shown as opponent columns (for pool-scoped tables) */
  poolPlayers?: Player[];
  isAuthenticated: boolean;
}

type Hits = {
  given: Map<number | null, number>;
  taken: Map<number | null, number>;
};

interface Opponents {
  [key: string]: Map<number | null, { winner: string | null; hits: number }>;
}

export function Player({
  player,
  nthRow,
  openModal,
  openEditModal,
  poolPlayers,
  isAuthenticated,
}: PlayerProps) {
  const context = useTournamentContext();
  const account = useUserContext();
  const t = useTranslations("Leaderboard");

  // Use poolPlayers for the opponent columns when provided, otherwise all players
  const opponentList = poolPlayers ?? context.players;

  async function removePlayer() {
    if (window.confirm(`${t("remove")} ${player.player.player_name}?`)) {
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
          (state) =>
            state && state.player.player_name !== player.player.player_name,
        );

        // Loop remaining players
        return players.map((p) => {
          if (!p) return p;
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
          type="button"
          onClick={() => removePlayer()}
          aria-label={`${t("remove")} ${player.player.player_name}`}
          className="bg-red-400 p-1 rounded-full hover:bg-red-500"
        >
          <TrashIcon className="h-5 w-5 text-white" />
        </button>
      </td>
    );
  };

  const { hits, matchesByOpponent } = useMemo(() => {
    const newHits: Hits = { given: new Map(), taken: new Map() };
    const newOpponents: Opponents = {};

    player.matches.forEach((match) => {
      const isPlayer1 = player.player.player_name === match.player1;
      const isPlayer2 = player.player.player_name === match.player2;

      if (isPlayer1 || isPlayer2) {
        const playerHits = isPlayer1 ? match.player1_hits : match.player2_hits;
        const opponentName = isPlayer1 ? match.player2 : match.player1;
        const roundKey = match.round_id; // null for legacy matches without a round

        newHits.given.set(roundKey, (newHits.given.get(roundKey) ?? 0) + playerHits);
        newHits.taken.set(
          roundKey,
          (newHits.taken.get(roundKey) ?? 0) +
            (isPlayer1 ? match.player2_hits : match.player1_hits),
        );

        if (opponentName) {
          if (!newOpponents[opponentName]) {
            newOpponents[opponentName] = new Map();
          }
          newOpponents[opponentName].set(roundKey, {
            winner: match.winner,
            hits: playerHits,
          });
        }
      } else {
        console.log(
          `Player ${player.player.player_name} not found in hits info.`,
        );
      }
    });

    return { hits: newHits, matchesByOpponent: newOpponents };
  }, [player.matches, player.player.player_name]);

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
      {isAuthenticated && (
        <td>
          <button
            type="button"
            aria-label={`${t("add")} ${player.player.player_name}`}
            onClick={() => openModal(player)}
          >
            <PlusCircleIcon className="h-8 w-8 text-blue-700" />
          </button>
        </td>
      )}
      {getRemovePlayerButton()}
      <td
        className={`${
          context.activeRound === 1 ? "bg-blue-500" : "bg-violet-500"
        } transition-all duration-300 ease-in-out text-white`}
      >
        {++nthRow}
      </td>

      {(() => {
        // Compute once outside the per-opponent loop to avoid an O(n) find on
        // every cell render (which would be O(players²) overall).
        const activeRoundId: number | null =
          context.rounds.find((r) => r.round_order === context.activeRound)
            ?.id ?? null;

        return opponentList.map((opponent, index) => {
        if (!opponent) return;
        const key = player.player.player_name + index;
        // Used to set dark bg color if players match, can't play versus self
        const isHighlighted =
          opponent.player.player_name === player.player.player_name;

        const matches = matchesByOpponent[opponent.player.player_name];
        const matchData = matches?.get(activeRoundId);

        // Early return if no match data found between players
        if (!matchData) {
          return (
            <td
              className={isHighlighted ? "bg-gray-600" : isAuthenticated ? "group" : ""}
              onClick={() => isAuthenticated && !isHighlighted && openModal(player, opponent)}
              key={key}
            >
              {isAuthenticated && (
                <button
                  type="button"
                  className="invisible group-hover:visible"
                  aria-label={`${player.player.player_name} vs. ${opponent.player.player_name}`}
                  title={`${player.player.player_name} vs. ${opponent.player.player_name}`}
                >
                  <PlusCircleIcon className="h-8 w-8 text-blue-700" />
                </button>
              )}
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
                : isAuthenticated
                  ? " underline decoration-dotted cursor-help underline-offset-2"
                  : ""
            }
            onClick={() => isAuthenticated && openEditModal(player, opponent)}
          >
            {result}
          </td>
        );
        });
      })()}

      {/* calculate win percentage based on matches associated with player */}
      {(() => {
        const activeRoundId: number | null =
          context.rounds.find((r) => r.round_order === context.activeRound)
            ?.id ?? null;
        const given = hits.given.get(activeRoundId) ?? 0;
        const taken = hits.taken.get(activeRoundId) ?? 0;
        return (
          <>
            <td
              className={`${
                context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
              }`}
            >
              {player.matches.reduce((n, match) => {
                if (
                  match.round_id === activeRoundId &&
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
              {given}
            </td>
            <td
              className={`${
                context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
              }`}
            >
              {taken}
            </td>
            <td
              className={`${
                context.activeRound === 1 ? "bg-blue-50" : "bg-violet-50"
              }`}
            >
              {given - taken}
            </td>
          </>
        );
      })()}
    </tr>
  );
}
