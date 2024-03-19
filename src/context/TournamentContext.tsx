"use client";

import { Player } from "@/types/Player";
import { createContext, useEffect, useMemo, useState } from "react";
import useContextWrapper from "./hooks/TournamentContextHook";
import { getTournamentToday } from "@/database/getTournament";
import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { Tournaments } from "@/database/types";

// Source: https://medium.com/@nitinjha5121/mastering-react-context-with-typescript-a-comprehensive-tutorial-5bab5ef48a3b

interface TournamentContext {
  tournament: Tournaments | undefined;
  setTournament: React.Dispatch<
    React.SetStateAction<TournamentContext["tournament"]>
  >;
  players: Player[];
  setPlayers: React.Dispatch<
    React.SetStateAction<TournamentContext["players"]>
  >;
}

export const TournamentContext = createContext<TournamentContext | null>(null);

export function TournamentContextProvider({
  children,
}: React.PropsWithChildren<{}>) {
  const [tournament, setTournament] = useState<TournamentContext["tournament"]>();
  const [players, setPlayers] = useState<TournamentContext["players"]>([]);

  // Fetch players to context
  useEffect(() => {
    async function fetchTournamentData() {
      const currentDate = new Date();
      const tournamentResult = await getTournamentToday(currentDate);

      if (!tournamentResult.success) return;

      setTournament(tournamentResult.value);

      const tournamentId = Number(tournamentResult.value.id);
      const playerResult = await getTournamentPlayers(tournamentId);

      if (!playerResult.success) return;

      setPlayers(playerResult.value);
    }

    fetchTournamentData();
  }, []);

  const value = useMemo(() => ({ tournament, setTournament, players, setPlayers }), [players, tournament]);

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournamentContext() {
  return useContextWrapper(TournamentContext, {
    contextName: useTournamentContext.name,
    providerName: TournamentContextProvider.name,
  });
}
