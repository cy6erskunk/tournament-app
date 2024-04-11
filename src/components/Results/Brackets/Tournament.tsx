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
export type Tournament = {
  players: Player[];
  rounds: Round[];
};

// Information passed up the bracket tournament to prevent
// players from advancing when current match is not ready
type PlayerInfo = {
  player?: Player; // Player data
  // Prevents players from skipping match when no opponent player present yet
  futurePlayer: boolean; // Will there be a player here in the future?
};

export default function Tournament() {
  const context = useTournamentContext();
  const [tournament, setTournament] = useState<Tournament | null>(null);
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
    (roundNumber: number, players: (Player | undefined)[]) => {
      if (!context.tournament) return;

      const round: Round = { id: roundNumber, matches: [] };

      for (let matchNumber = 0; matchNumber < players.length / 2; matchNumber++) {
        const player1 = players[matchNumber * 2];
        const player2 = players[matchNumber * 2 + 1];

        if (!player1 || !player2) {
          const match: Match = {
            match: matchNumber + 1,
            player1: player1,
            player2: player2,
            player1_hits: 0,
            player2_hits: 0,
            round: roundNumber,
            tournament_id: context.tournament.id ?? 0,
            winner: null,
          };
          round.matches.push(match);
          continue
        }

        // Do the players share a match?
        const matchIds = player1.matches.map((match) => match.id);
        const hasMatch = player2.matches.find((match) =>
          matchIds.includes(match.id),
        );

        if (hasMatch) {
          round.matches.push(castToMatch(hasMatch));
          continue;
        }

        // If player1 and player2 don't share a match, create an empty one
        // This is so we can still display the match in the bracket
        // even if it hasn't been played yet
        const match: Match = {
          match: matchNumber + 1,
          player1: player1,
          player2: player2,
          player1_hits: 0,
          player2_hits: 0,
          round: roundNumber,
          tournament_id: context.tournament.id ?? 0,
          winner: null,
        };
        round.matches.push(match);
      }

      return round;
    },
    [castToMatch, context.tournament],
  );

  const buildTournament = useCallback((capacity?: number) => {
    // Ensure there are enough players to build the tournament
    if (!context.players || context.players.length < 2) {
      // TODO: Handle insufficient players case
      return;
    }

    const tournament: Tournament = {
      players: context.players,
      rounds: [],
    };

    // If capacity is defined, fill the players array with placeholder data
    let players: PlayerInfo[];
    if (capacity) {
      players = new Array<PlayerInfo>(capacity)
      players.fill({ player: undefined, futurePlayer: false })
    } else {
      players = []
    }

    // Populate the players array
    // This will also replace placeholder data if capacity was set
    context.players.forEach((player, i) => {
      players[i] = { player: player, futurePlayer: true }
    });

    // Amount of rounds we should have based on players
    const rounds = Math.ceil(Math.log2(context.players.length));

    // Loop through and build each round
    for (let i = 1; i <= rounds; i++) {
      const round = buildRound(i, players.map(info => info.player));
      if (!round) continue;
      tournament.rounds.push(round);

      type Pair = [PlayerInfo, PlayerInfo]
      const pairs: Pair[] = [];
      let latest: PlayerInfo = { player: undefined, futurePlayer: false }
      players.forEach((player, i) => {
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
          console.log("Error checking for players")
          const res = { player: undefined, futurePlayer: false }
          advancers.set(i, res)
          return
        }

        const winner = p1.player.player.player_name === match.winner ? p1 : p2
        advancers.set(i, winner)
        return
      })

      console.log(`Round ${i}: (${players.map(p => [p.player?.player.player_name ?? "undefined", p.futurePlayer].join(" "))})`)
      players = Array.from(advancers.values())
    }

    return tournament;
  }, [buildRound, context.players]);

  useEffect(() => {
    // Populate a tournament with rounds and matches from context.players using a pair of players for each match
    // If the players already have a match between them in context.players.matches then pair them up, if not
    // then still generate a empty match/element for them
    const tournament = buildTournament(capacity);
    if (!tournament) return;
    setTournament(tournament);
  }, [buildTournament, context.players, context.tournament, capacity]);

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
