"use client";

import { Player } from "@/types/Player";
import { createContext, useEffect, useMemo, useState } from "react";
import useContextWrapper from "./hooks/TournamentContextHook";
import { getTournamentWithId } from "@/database/getTournament";
import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { getPools, PoolRow } from "@/database/getPools";
import { getRounds, RoundRow } from "@/database/getRounds";
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
  rounds: RoundRow[];
  setRounds: React.Dispatch<React.SetStateAction<TournamentContext["rounds"]>>;
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
  const [rounds, setRounds] = useState<TournamentContext["rounds"]>([]);
  const [loading, setLoading] = useState<TournamentContext["loading"]>(true);
  const [activeRound, setActiveRound] =
    useState<TournamentContext["activeRound"]>(1);
  const [hidden, setHidden] = useState(true);
  const params = useParams();
  // Fetch players to context (and tournament if not provided initially or if navigating to different tournament)
  useEffect(() => {
    async function fetchTournamentData() {
      let tournamentId: number;

      // Only use initialTournament if it matches the current params.id
      if (
        initialTournament &&
        Number(initialTournament.id) === Number(params.id)
      ) {
        tournamentId = Number(initialTournament.id);
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
      }

      const [playerResult, poolResult, roundResult] = await Promise.all([
        getTournamentPlayers(tournamentId),
        getPools(tournamentId),
        getRounds(tournamentId),
      ]);

      if (!playerResult.success) {
        console.log("Error: " + playerResult.error);
        setLoading(false);
        return;
      }

      let poolsToSet = poolResult.success ? poolResult.value : [];

      // Pool-round tournaments always have at least one pool. Auto-create if missing
      // (fallback for any edge case where pool wasn't created at tournament creation time).
      // Requires admin session; uses fetch to avoid server-action cross-module issues.
      const rounds = roundResult.success ? roundResult.value : [];
      const hasPoolsRound = rounds.some((r) => r.type === "pools");
      if (hasPoolsRound && poolsToSet.length === 0) {
        const createRes = await fetch(`/api/tournament/${tournamentId}/pools`, {
          method: "POST",
        });
        if (createRes.ok) {
          const pool = await createRes.json();
          poolsToSet = [pool];
        }
      }

      setPools(poolsToSet);
      setRounds(rounds);
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
      rounds,
      setRounds,
      loading,
      setLoading,
      activeRound,
      setActiveRound,
      hidden,
      setHidden,
    }),
    [players, pools, rounds, tournament, loading, activeRound, hidden],
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
