"use client";

import { TournamentTitle } from "@/components/Results/Title";
import Round from "./Round";
import { useTournamentContext } from "@/context/TournamentContext";
import type { Player } from "@/types/Player";
import { useEffect, useMemo, useState } from "react";
import Rounds from "./Rounds";
import RoundNav from "@/components/rounds";
import { jsonParser } from "@/helpers/jsonParser";
import { getTournamentsForSeeding } from "@/database/getTournament";
import { useTranslations } from "next-intl";
import { useUserContext } from "@/context/UserContext";
import type { TournamentPlayersCount } from "@/types/TournamentPlayersCount";
import { UserIcon } from "@heroicons/react/24/outline";
import { buildRounds } from "./bracketUtils";

// Re-export types for use by other bracket components (Match.tsx, Round.tsx, etc.)
export type { Match, Round } from "./bracketUtils";

export default function Tournament() {
  const t = useTranslations("Brackets");
  const context = useTournamentContext();
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [seedTournaments, setSeedTournaments] = useState<
    TournamentPlayersCount[]
  >([]);
  const account = useUserContext();

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
          () => [],
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

        matches.forEach((match) => {
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
      allPlayers: context.players,
    });
  }, [context.players, context.tournament, capacity, context.loading]);

  useEffect(() => {
    async function fetchTournamentsForSeeding() {
      const tournaments = await getTournamentsForSeeding();
      if (tournaments.success) {
        setSeedTournaments(tournaments.value);
      }
    }
    fetchTournamentsForSeeding();
  }, []);

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

  if (!tournament) {
    return null;
  }

  return (
    <>
      <div className="container mx-auto sm:my-2 items-center text-xl sm:text-4xl font-bold flex justify-between gap-4">
        <TournamentTitle />
        <RoundNav />
      </div>

      {!context.players.length && account.user?.role === "admin" ? (
        <div className="container mx-auto w-full space-y-5">
          <h1 className="text-2xl font-bold">{t("selectseed")}</h1>
          {seedTournaments.length > 0 ? (
            <ul className="flex flex-col gap-8">
              {seedTournaments.map((tour) => (
                <li className="max-w-sm" key={tour.id}>
                  <button
                    type="button"
                    className="flex justify-between gap-4 py-4 px-3 rounded-md shadow-xs border border-black hover:bg-gray-100 w-full"
                    onClick={() => seedTournament(tour.id)}
                  >
                    {tour.name}
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5" />
                      {tour.playersCount}
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

      <div className="flex mr-3 mt-16 gap-16 mb-10 overflow-x-auto">
        <Rounds tournament={tournament} />
      </div>
    </>
  );
}
