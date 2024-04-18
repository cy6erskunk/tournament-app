"use client";

import { TournamentTitle } from "@/components/Results/Title";
import Round from "./Round";
import Match from "./Match";
import { useTournamentContext } from "@/context/TournamentContext";
import { Player } from "@/types/Player";
import { Matches } from "@/types/Kysely";
import { useCallback, useEffect, useState } from "react";
import Rounds from "./Rounds";
import NormalizedId from "@/types/NormalizedId";

// These types describe a match on the frontend, not 1:1 with
// database data as this is also used for displaying matches
// that have not been played yet

// This type overwrites the default string types of player1 and player2
// Also omits the id field completely from the original db type
// So we don't have to manually set it as it's only used for matching
// players matches when fetched from the database
export type Match = Omit<Matches, "id" | "player1" | "player2"> & {
  player1?: Player;
  player2?: Player;
};

export type Round = { id: number; matches: Match[] };

// Information passed up the bracket tournament to prevent
// players from advancing when current match is not ready
type PlayerInfo = {
  player?: Player; // Player data
  // Prevents players from skipping match when no opponent player present yet
  futurePlayer: boolean; // Will there be a player here in the future?
};

type Pair = [PlayerInfo, PlayerInfo]

export default function Tournament() {
  const context = useTournamentContext();
  const [tournament, setTournament] = useState<Round[]>([]);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);

  const getMatchByPlayer = (player: Player, round: Round) => {
    return round.matches.find(
      (match) => match.player1 === player || match.player2 === player,
    );
  };

  // Casts a Matches object into a Match object
  const castToMatch = useCallback(
    (match: Matches | NormalizedId<Matches>) => {
      const { id, player1, player2, ...rest } = match;
      return {
        ...rest,
        player1: context.players.find(
          (player) => player.player.player_name === player1,
        ),
        player2: context.players.find(
          (player) => player.player.player_name === player2,
        ),
      } as Match;
    },
    [context.players],
  );

  const buildRound = useCallback(
    (roundNumber: number, tournamentId: number, pairs: Pair[]) => {
      const msg = "%cBuilding round: " + roundNumber
      if (!tournamentId) return;
      const matches = new Map<number, Match>();

      // Populate matches based on found match IDs
      for (let pair of pairs) {
        const [i1, i2] = pair;
        const p1 = i1.player;
        const p2 = i2.player;

        if (!p1 || !p2) continue

        // If players share a match, add it to the round
        const matchIds = p1.matches.map(match => match.id)
        const hasMatch = p2.matches.find(match => matchIds.includes(match.id))

        if (!hasMatch) continue
        if (hasMatch.round !== roundNumber) continue

        // matches.set(`${hasMatch.match} ${hasMatch.round}`, castToMatch(hasMatch))
        matches.set(hasMatch.match, castToMatch(hasMatch))
      }

      // Fill in the blanks for pairs that don't have matches
      for (let i in pairs) {
        const matchId = Number(i) + 1
        if (matches.has(matchId)) continue

        const match: Match = {
          match: matchId,
          player1: pairs[i][0].player,
          player2: pairs[i][1].player,
          player1_hits: 0,
          player2_hits: 0,
          round: roundNumber,
          tournament_id: tournamentId,
          winner: null,
        };

        matches.set(matchId, match)
      }

      const round: Round = { id: roundNumber, matches: Array.from(matches.values()).sort((a, b) => a.match - b.match) };
      return round;
    },
    [castToMatch],
  );

  type RoundProps = {
    capacity?: number;
    tournamentId: number;
    players: Player[];
  }

  const buildRounds = useCallback(({ capacity, tournamentId, players }: RoundProps) => {
    // Ensure there are enough players to build the tournament
    if (!players || players.length < 2) {
      // TODO: Handle insufficient players case
      return;
    }

    const rounds: Round[] = [];

    // If capacity is defined, fill the players array with placeholder data
    let playerInfo: PlayerInfo[];
    if (capacity) {
      playerInfo = new Array<PlayerInfo>(capacity)
      playerInfo.fill({ player: undefined, futurePlayer: false })
    } else {
      playerInfo = []
    }

    // Populate the players array
    // This will also replace placeholder data if capacity was set
    players.forEach((player, i) => {
      playerInfo[i] = { player: player, futurePlayer: true }
    });

    // Amount of rounds we should have based on players
    const roundCount = Math.ceil(Math.log2(players.length));

    // Loop through and build each round
    for (let i = 1; i <= roundCount; i++) {
      const pairs: Pair[] = [];
      let latest: PlayerInfo = { player: undefined, futurePlayer: false }
      playerInfo.forEach((player, i) => {
        // If i + 1 is an equal number, last should exist and we create a pair
        if ((i + 1) % 2 == 0) {
          pairs.push([latest, player])
          latest = { player: undefined, futurePlayer: false }
          return
        }
        // Save the player as "latest" for pairing with next player
        latest = player
        return
      })
      // If last is still defined, create an extra match
      if (latest.player) {
        pairs.push([latest, { player: undefined, futurePlayer: false }])
      }

      const round = buildRound(i, tournamentId, pairs);
      if (!round) continue;
      rounds.push(round);

      const advancers = new Map<number, PlayerInfo>();
      pairs.forEach((pair, i) => {
        const p1 = pair[0]
        const p2 = pair[1]
        // Helps us catch cases where only one player exists
        // giving us the existing player
        let p: PlayerInfo
        if (p1.player) {
          p = p1
        } else {
          p = p2
        }

        // If neither exist, pass undefined
        if (!p.player) {
          const res = { player: undefined, futurePlayer: false }
          advancers.set(i, res)
          return
        }

        if (!p1.futurePlayer || !p2.futurePlayer) {
          advancers.set(i, p)
          return
        }

        // Tries to find if the players have a match between them
        const match = getMatchByPlayer(p.player, round)

        // If no match found, don't advance either player
        if (!match) {
          const res = { player: undefined, futurePlayer: true }
          advancers.set(i, res)
          return
        }

        // If no match winner, don't advance either player
        // FIXME: Matches should always have a winner...?
        if (!match.winner) {
          const res = { player: undefined, futurePlayer: true }
          advancers.set(i, res)
          return
        }

        if (!p1.player || !p2.player) {
          const res = { player: undefined, futurePlayer: false }
          advancers.set(i, res)
          return
        }

        const winner = p1.player.player.player_name === match.winner ? p1 : p2
        advancers.set(i, winner)
        return
      })

      playerInfo = Array.from(advancers.values())
    }

    return rounds;
  }, [buildRound]);

  useEffect(() => {
    if (context.loading) return
    if (!context.tournament) return

    // Populate a tournament with rounds and matches from context.players using a pair of players for each match
    // If the players already have a match between them in context.players.matches then pair them up, if not
    // then still generate a empty match/element for them
    const tournament = buildRounds({ capacity, tournamentId: context.tournament.id, players: context.players }) ?? []

    if (!tournament) return;
    setTournament(tournament);
  }, [buildRounds, context.players, context.tournament, capacity, context.loading]);

  // TODO: Handle the case where tournament is null
  if (!tournament) {
    return;
  }

  return (
    <div className="w-full">
      <div className="sm:my-2 items-center text-xl sm:text-4xl font-bold flex justify-between">
        <TournamentTitle />
        <div className="flex">
          <label htmlFor="number-input" className="mb-2 text-sm font-medium text-gray-900">Tournament Capacity</label>
          <input type="number" id="number-input" onChange={(e) => setCapacity(Number(e.currentTarget.value))} aria-describedby="helper-text-explanation" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="TEST INPUT" required />
        </div>
      </div>
      <div className="flex mr-3 mt-16 gap-16">
        <Rounds tournament={tournament} />
      </div>
    </div>
  );
}
