"use client";

import { TournamentTitle } from "@/components/Results/Title";
import Round from "./Round";
import Match from "./Match";
import { useTournamentContext } from "@/context/TournamentContext";
import type { Player } from "@/types/Player";
import type { MatchRow } from "@/types/MatchTypes";
import { useCallback, useEffect, useMemo, useState } from "react";
import Rounds from "./Rounds";
import { jsonParser } from "@/helpers/jsonParser";
import { getRoundRobinTournaments } from "@/database/getTournament";
import { useTranslations } from "next-intl";
import { useUserContext } from "@/context/UserContext";
import type { RoundRobinCount } from "@/types/RoundRobinCount";
import { UserIcon } from "@heroicons/react/24/outline";
import {
  getAllConsolationSections,
  parseBracketSection,
  sectionLabel,
} from "@/helpers/consolationBracket";

// These types describe a match on the frontend, not 1:1 with
// database data as this is also used for displaying matches
// that have not been played yet

// This type overwrites the default string types of player1 and player2
// Also omits the id field completely from the original db type
// So we don't have to manually set it as it's only used for matching
// players matches when fetched from the database
export type Match = Omit<MatchRow, "id" | "player1" | "player2"> & {
  player1: Player | null;
  player2: Player | null;
};

export type Round = { id: number; matches: Match[] };

// Information passed up the bracket tournament to prevent
// players from advancing when current match is not ready
type PlayerInfo = {
  player: Player | null; // Player data
  // Prevents players from skipping match when no opponent player present yet
  futurePlayer: boolean; // Will there be a player here in the future?
};

type Pair = [PlayerInfo, PlayerInfo];

export type ConsolationBracket = {
  section: string;
  label: string;
  rounds: Round[];
};

export default function Tournament() {
  const t = useTranslations("Brackets");
  const context = useTournamentContext();
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [rrTournaments, setRrTournaments] = useState<RoundRobinCount[]>([]);
  const account = useUserContext();

  const getMatchByPlayer = (player: Player, round: Round) => {
    return round.matches.find(
      (match) => match.player1 === player || match.player2 === player,
    );
  };

  // Casts a MatchRow object into a Match object
  const castToMatch = useCallback(
    (match: MatchRow) => {
      const { id, player1, player2, ...rest } = match;
      return {
        ...rest,
        player1: context.players.find(
          (player) => player && player.player.player_name === player1,
        ),
        player2: context.players.find(
          (player) => player && player.player.player_name === player2,
        ),
      } as Match;
    },
    [context.players],
  );

  const buildRound = useCallback(
    (
      roundNumber: number,
      tournamentId: number,
      pairs: Pair[],
      bracketSection: string | null,
    ) => {
      if (!tournamentId) return;
      const matches = new Map<number, Match>();

      // Populate matches based on found match IDs
      for (let pair of pairs) {
        const [i1, i2] = pair;
        const p1 = i1.player;
        const p2 = i2.player;

        if (!p1 || !p2) continue;

        // If players share a match in this section and round, add it to the round
        const matchIds = p1.matches.map((match) => match.id);
        const hasMatch = p2.matches.find((match) =>
          matchIds.includes(match.id),
        );

        if (!hasMatch) continue;
        if (hasMatch.round !== roundNumber) continue;
        if (hasMatch.bracket_section !== bracketSection) continue;

        matches.set(hasMatch.match, castToMatch(hasMatch));
      }

      // Fill in the blanks for pairs that don't have matches
      for (let i in pairs) {
        const matchId = Number(i) + 1;
        if (matches.has(matchId)) continue;

        const match: Match = {
          match: matchId,
          player1: pairs[i][0].player,
          player2: pairs[i][1].player,
          player1_hits: 0,
          player2_hits: 0,
          round: roundNumber,
          tournament_id: tournamentId,
          winner: "",  // Empty string for unplayed matches
          submitted_by_token: null,
          submitted_at: null,
          bracket_section: bracketSection,
        };

        matches.set(matchId, match);
      }

      const round: Round = {
        id: roundNumber,
        matches: Array.from(matches.values()).sort((a, b) => a.match - b.match),
      };
      return round;
    },
    [castToMatch],
  );

  type RoundProps = {
    capacity?: number;
    tournamentId: number;
    players: (Player | null)[];
    bracketSection: string | null;
    initialPlayerInfos?: PlayerInfo[];
  };

  const buildRounds = useCallback(
    ({ capacity, tournamentId, players, bracketSection, initialPlayerInfos }: RoundProps) => {
      // For consolation brackets, initialPlayerInfos may be provided directly
      // For main bracket, build from players array
      let playerInfo: PlayerInfo[];

      if (initialPlayerInfos) {
        playerInfo = initialPlayerInfos;
      } else {
        // Ensure there are enough players to build the tournament
        if (!players || players.length < 2) {
          return;
        }

        if (capacity) {
          playerInfo = new Array<PlayerInfo>(capacity);
          playerInfo.fill({ player: null, futurePlayer: false });
        } else {
          playerInfo = [];
        }

        players.forEach((player, i) => {
          playerInfo[i] = { player: player, futurePlayer: Boolean(player) };
        });
      }

      if (playerInfo.length < 2) return;

      const rounds: Round[] = [];
      const roundCount = Math.ceil(Math.log2(playerInfo.length));

      for (let i = 1; i <= roundCount; i++) {
        const pairs: Pair[] = [];
        let latest: PlayerInfo = { player: null, futurePlayer: false };
        playerInfo.forEach((player, i) => {
          if ((i + 1) % 2 == 0) {
            pairs.push([latest, player]);
            latest = { player: null, futurePlayer: false };
            return;
          }
          latest = player;
          return;
        });
        if (latest.player) {
          pairs.push([latest, { player: null, futurePlayer: false }]);
        }

        const round = buildRound(i, tournamentId, pairs, bracketSection);
        if (!round) continue;
        rounds.push(round);

        const advancers = new Map<number, PlayerInfo>();
        pairs.forEach((pair, i) => {
          const p1 = pair[0];
          const p2 = pair[1];
          let p: PlayerInfo;
          if (p1.player) {
            p = p1;
          } else {
            p = p2;
          }

          if (!p.player) {
            const res = { player: null, futurePlayer: false };
            advancers.set(i, res);
            return;
          }

          if (!p1.futurePlayer || !p2.futurePlayer) {
            advancers.set(i, p);
            return;
          }

          const match = getMatchByPlayer(p.player, round);

          if (!match) {
            const res = { player: null, futurePlayer: true };
            advancers.set(i, res);
            return;
          }

          if (!match.winner) {
            const res = { player: null, futurePlayer: true };
            advancers.set(i, res);
            return;
          }

          if (!p1.player || !p2.player) {
            const res = { player: null, futurePlayer: false };
            advancers.set(i, res);
            return;
          }

          const winner =
            p1.player.player.player_name === match.winner ? p1 : p2;
          advancers.set(i, winner);
          return;
        });

        playerInfo = Array.from(advancers.values());
      }

      return rounds;
    },
    [buildRound],
  );

  /** Extract losers from a bracket round as PlayerInfo for consolation input. */
  const getLosersFromRound = useCallback((round: Round): PlayerInfo[] => {
    return round.matches.map((match) => {
      const p1 = match.player1;
      const p2 = match.player2;

      // Bye: one player is null → no loser goes to consolation
      if (!p1 || !p2) {
        return { player: null, futurePlayer: false };
      }

      if (!match.winner) {
        // Both players exist but result not yet entered → loser unknown but will exist
        return { player: null, futurePlayer: true };
      }

      // Return the loser
      const loser = p1.player.player_name === match.winner ? p2 : p1;
      return { player: loser, futurePlayer: Boolean(loser) };
    });
  }, []);

  // Seed this tournament based on another tournament
  async function seedTournament(tournamentId: number) {
    if (context.loading) return;

    context.setLoading(true);

    try {
      if (!context.tournament) {
        context.setLoading(false);
        return;
      }

      const res = await fetch(
        `/api/tournament/${tournamentId}/seed/${context.tournament.id}`,
      );

      if (!res.ok) {
        context.setLoading(false);
        return;
      }
      const players = jsonParser<Player[]>(await res.text());
      if (!players.success) {
        context.setLoading(false);
        return;
      }

      context.setPlayers(players.value);
    } catch (error) {
      context.setLoading(false);
      console.error(error);
    }

    context.setLoading(false);
  }

  const tournament = useMemo(() => {
    if (context.loading) return [];
    if (!context.tournament) return [];

    let players: (Player | null)[] = context.players;

    if (!players.some((player) => player === null)) {
      const seeded = players.some((player) => player?.player.bracket_seed);

      if (seeded) {
        const matchCount = Math.max(
          ...players.map((player) => player?.player.bracket_match ?? 0),
        );
        const matches: (Player | null)[][] = Array.from(
          { length: matchCount },
          (e) => new Array(),
        );

        players.forEach((player) => {
          console.log(player);

          if (!player) return;

          const matchId = player.player.bracket_match;
          if (!matchId) return;

          if (matches[matchId - 1].length < 2) {
            matches[matchId - 1].push(player);
          }
        });

        matches.map((match) => {
          if (match.length % 2 !== 0) {
            match.push(null);
          }
        });

        console.log(matches);

        players = matches.flat();
      }
    }

    return buildRounds({
      capacity,
      tournamentId: context.tournament.id,
      players,
      bracketSection: null,
    }) ?? [];
  }, [
    buildRounds,
    context.players,
    context.tournament,
    capacity,
    context.loading,
  ]);

  /** Build all consolation sections recursively from main bracket rounds. */
  const consolationSections = useMemo<ConsolationBracket[]>(() => {
    const placementSize = context.tournament?.placement_size;
    if (!placementSize || !tournament.length || !context.tournament) return [];

    const currentTournament = context.tournament;
    const tournamentId = currentTournament.id;
    const allSections = getAllConsolationSections(placementSize);

    return allSections.map((section) => {
      const { top, bottom } = parseBracketSection(section, placementSize);
      const N = bottom - top + 1;

      // Find which parent section and round feeds into this consolation section.
      // The parent section covers [parentTop, parentBottom] where parentBottom is bottom.
      // The loser round within the parent is the round R where:
      //   top = parentTop + parentN / 2^R
      // We need to find the parent by looking at which section has top/bottom that
      // generates this consolation section.
      //
      // Strategy: for each completed consolation section, find the parent rounds
      // by identifying who has matches with bracket_section that feeds here.
      // Simpler: use the player's matches filtered by this section to get players.

      // Collect all players who have at least one match in this consolation section
      const sectionPlayers = context.players.filter((player) =>
        player?.matches.some((m) => m.bracket_section === section),
      );

      if (sectionPlayers.length === 0) {
        // No matches recorded yet for this section.
        // Try to derive players from the parent bracket's losers.
        const parentSection = findParentSection(section, placementSize);
        // parentSection === undefined means "not found"; parentSection === null means "main bracket is parent"
        if (parentSection === undefined) return { section, label: sectionLabel(section), rounds: [] };

        const parentRounds = parentSection === null
          ? tournament
          : getConsolationRoundsForSection(parentSection, context.players, tournamentId, buildRounds);

        // Find which round of the parent feeds into this section
        const parentRange = parseBracketSection(parentSection, placementSize);
        const parentN = parentRange.bottom - parentRange.top + 1;

        // Loser round R: top = parentTop + parentN / 2^R → R = log2(parentN / (top - parentTop))
        const diff = top - parentRange.top;
        if (diff <= 0) return { section, label: sectionLabel(section), rounds: [] };
        const R = Math.round(Math.log2(parentN / diff));
        if (R < 1 || R >= parentRounds.length + 1) return { section, label: sectionLabel(section), rounds: [] };

        const parentRound = parentRounds[R - 1];
        if (!parentRound) return { section, label: sectionLabel(section), rounds: [] };

        const loserInfos = getLosersFromRound(parentRound);
        const hasAnyPlayer = loserInfos.some(
          (info) => info.player !== null || info.futurePlayer,
        );
        if (!hasAnyPlayer) return { section, label: sectionLabel(section), rounds: [] };

        const rounds = buildRounds({
          tournamentId,
          players: [],
          bracketSection: section,
          initialPlayerInfos: loserInfos,
        }) ?? [];

        return { section, label: sectionLabel(section), rounds };
      }

      // Players found via their matches → build rounds from those matches
      const initialInfos: PlayerInfo[] = sectionPlayers.map((p) => ({
        player: p,
        futurePlayer: Boolean(p),
      }));

      const rounds = buildRounds({
        tournamentId,
        players: [],
        bracketSection: section,
        initialPlayerInfos: initialInfos,
      }) ?? [];

      return { section, label: sectionLabel(section), rounds };
    });
  }, [
    tournament,
    context.tournament,
    context.players,
    buildRounds,
    getLosersFromRound,
  ]);

  useEffect(() => {
    async function fetchRRTournaments() {
      const roundRobinTournaments = await getRoundRobinTournaments();
      if (roundRobinTournaments.success) {
        setRrTournaments(roundRobinTournaments.value);
        return;
      }
    }
    fetchRRTournaments();
  }, []);

  if (!tournament) {
    return;
  }

  return (
    <>
      <div className="container mx-auto sm:my-2 items-center text-xl sm:text-4xl font-bold flex justify-between">
        <TournamentTitle />
      </div>

      {/* select seed from round robin tournament */}
      {!context.players.length && account.user?.role === "admin" ? (
        <div className="container mx-auto w-full space-y-5">
          <h1 className="text-2xl font-bold">{t("selectseed")}</h1>
          {rrTournaments.length > 0 ? (
            <ul className="flex flex-col gap-8">
              {rrTournaments.map((rrTour) => (
                <li className="max-w-sm" key={rrTour.id}>
                  <button
                    type="button"
                    className="flex justify-between gap-4 py-4 px-3 rounded-md shadow-xs border border-black hover:bg-gray-100 w-full"
                    onClick={() => seedTournament(rrTour.id)}
                  >
                    {rrTour.name}
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5" />
                      {rrTour.playersCount}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>{t("noRRtournamentsfound")}</p>
          )}
        </div>
      ) : null}

      {/* Main bracket */}
      <div className="flex mr-3 mt-16 gap-16 mb-10 overflow-x-auto">
        <Rounds tournament={tournament} />
      </div>

      {/* Consolation sections (only for placement tournaments) */}
      {consolationSections
        .filter((cs) => cs.rounds.length > 0)
        .map((cs) => (
          <div key={cs.section} className="mt-8">
            <div className="container mx-auto mb-4">
              <h2 className="text-xl font-semibold text-gray-700 border-b border-gray-300 pb-2">
                {cs.label}
              </h2>
            </div>
            <div className="flex mr-3 gap-16 mb-10 overflow-x-auto">
              <Rounds tournament={cs.rounds} />
            </div>
          </div>
        ))}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Pure helpers (outside component to keep JSX clean)
// ──────────────────────────────────────────────────────────────

/**
 * Given a consolation section like "c9-16", find the parent section
 * string (null = main bracket, or "c5-8" etc.) that generates it.
 */
function findParentSection(
  section: string,
  placementSize: number,
): string | null | undefined {
  const { top, bottom } = parseBracketSection(section, placementSize);

  // Try main bracket as parent
  const mainN = placementSize;
  for (let r = 1; r < Math.log2(mainN); r++) {
    const consTop = 1 + mainN / Math.pow(2, r);
    const consBottom = 1 + mainN / Math.pow(2, r - 1) - 1;
    if (Math.round(consTop) === top && Math.round(consBottom) === bottom) {
      return null; // parent is main bracket
    }
  }

  // Try each consolation section as parent
  const allSections = getAllConsolationSections(placementSize);
  for (const parentCandidate of allSections) {
    if (parentCandidate === section) continue;
    const parentRange = parseBracketSection(parentCandidate, placementSize);
    const parentN = parentRange.bottom - parentRange.top + 1;

    for (let r = 1; r < Math.log2(parentN); r++) {
      const consTop = parentRange.top + parentN / Math.pow(2, r);
      const consBottom = parentRange.top + parentN / Math.pow(2, r - 1) - 1;
      if (Math.round(consTop) === top && Math.round(consBottom) === bottom) {
        return parentCandidate;
      }
    }
  }

  return undefined; // not found
}

/**
 * Build rounds for a given consolation section by filtering players
 * who have matches in that section and calling buildRounds.
 * This is used to get the rounds of a parent consolation section
 * when we need to extract its losers.
 */
function getConsolationRoundsForSection(
  section: string,
  allPlayers: (Player | null)[],
  tournamentId: number,
  buildRoundsFn: (props: {
    capacity?: number;
    tournamentId: number;
    players: (Player | null)[];
    bracketSection: string | null;
    initialPlayerInfos?: { player: Player | null; futurePlayer: boolean }[];
  }) => Round[] | undefined,
): Round[] {
  const sectionPlayers = allPlayers.filter((player) =>
    player?.matches.some((m) => m.bracket_section === section),
  );

  if (sectionPlayers.length === 0) return [];

  const initialInfos = sectionPlayers.map((p) => ({
    player: p,
    futurePlayer: Boolean(p),
  }));

  return buildRoundsFn({
    tournamentId,
    players: [],
    bracketSection: section,
    initialPlayerInfos: initialInfos,
  }) ?? [];
}
