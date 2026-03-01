"use client";

import { Player } from "@/types/Player";
import { createContext, useEffect, useMemo, useState } from "react";
import useContextWrapper from "./hooks/TournamentContextHook";
import { getTournamentWithId } from "@/database/getTournament";
import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { getPools, PoolRow } from "@/database/getPools";
import { useParams } from "next/navigation";
import Tournament from "@/types/Tournament";

// Source: https://medium.com/@nitinjha5121/mastering-react-context-with-typescript-a-comprehensive-tutorial-5bab5ef48a3b

export interface TournamentContext {
  tournament: Tournament | undefined;
  setTournament: React.Dispatch<
    React.SetStateAction<TournamentContext["tournament"]>
  >;
  players: (Player | null)[];
  setPlayers: React.Dispatch<
    React.SetStateAction<TournamentContext["players"]>
  >;
  pools: PoolRow[];
  setPools: React.Dispatch<React.SetStateAction<TournamentContext["pools"]>>;
  loading: boolean;
  setLoading: React.Dispatch<
    React.SetStateAction<TournamentContext["loading"]>
  >;
  activeRound: number;
  setActiveRound: React.Dispatch<
    React.SetStateAction<TournamentContext["activeRound"]>
  >;
  hidden: boolean;
  setHidden: React.Dispatch<React.SetStateAction<TournamentContext["hidden"]>>;
}

export const TournamentContext = createContext<TournamentContext | null>(null);

interface TournamentContextProviderProps {
  initialTournament?: Tournament;
  children: React.ReactNode;
}

export function TournamentContextProvider({
  children,
  initialTournament,
}: TournamentContextProviderProps) {
  const [tournament, setTournament] =
    useState<TournamentContext["tournament"]>(initialTournament);
  const [players, setPlayers] = useState<TournamentContext["players"]>([]);
  const [pools, setPools] = useState<TournamentContext["pools"]>([]);
  const [loading, setLoading] = useState<TournamentContext["loading"]>(true);
  const [activeRound, setActiveRound] =
    useState<TournamentContext["activeRound"]>(1);
  const [hidden, setHidden] = useState(true);
  const params = useParams();
  // Fetch players to context (and tournament if not provided initially or if navigating to different tournament)
  useEffect(() => {
    async function fetchTournamentData() {
      let tournamentId: number;
      let tournamentFormat: string;

      // Only use initialTournament if it matches the current params.id
      if (
        initialTournament &&
        Number(initialTournament.id) === Number(params.id)
      ) {
        tournamentId = Number(initialTournament.id);
        tournamentFormat = initialTournament.format;
        // Keep state synchronized with the prop
        setTournament(initialTournament);
      } else {
        const tournamentResult = await getTournamentWithId(Number(params.id));

        if (!tournamentResult.success) {
          console.log("Error: " + tournamentResult.error);
          setLoading(false);
          return;
        }

        setTournament(tournamentResult.value);
        tournamentId = Number(tournamentResult.value.id);
        tournamentFormat = tournamentResult.value.format;
      }

      const [playerResult, poolResult] = await Promise.all([
        getTournamentPlayers(tournamentId),
        getPools(tournamentId),
      ]);

      if (!playerResult.success) {
        console.log("Error: " + playerResult.error);
        setLoading(false);
        return;
      }

      let poolsToSet = poolResult.success ? poolResult.value : [];

      // Round-robin tournaments always have at least one pool. Auto-create if missing.
      if (tournamentFormat === "Round Robin" && poolsToSet.length === 0) {
        const createRes = await fetch(`/api/tournament/${tournamentId}/pools`, {
          method: "POST",
        });
        if (createRes.ok) {
          const newPoolResult = await getPools(tournamentId);
          if (newPoolResult.success) {
            poolsToSet = newPoolResult.value;
          }
        }
      }

      setPools(poolsToSet);
      setLoading(false);
      setPlayers(playerResult.value);
    }

    fetchTournamentData();
  }, [params.id, initialTournament?.id]);

  const value = useMemo(
    () => ({
      tournament,
      setTournament,
      players,
      setPlayers,
      pools,
      setPools,
      loading,
      setLoading,
      activeRound,
      setActiveRound,
      hidden,
      setHidden,
    }),
    [players, pools, tournament, loading, activeRound, hidden],
  );

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
