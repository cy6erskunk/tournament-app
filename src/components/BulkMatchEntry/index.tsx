"use client";

import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import {
  useState,
  useRef,
  useCallback,
  KeyboardEvent,
  useMemo,
  useEffect,
} from "react";
import { MatchRow, NewMatch } from "@/types/MatchTypes";
import { Player } from "@/types/Player";
import Button from "@/components/Button";
import { DrawWinnerDialog } from "./DrawWinnerDialog";
import { MatchTable } from "./MatchTable";
import type { CellData, DrawMatch, PlayerWithIndex } from "./types";

interface BulkMatchEntryProps {
  closeModal: () => void;
}

interface PendingMatch {
  player1: string;
  player2: string;
  player1_hits: number;
  player2_hits: number;
  winner: string;
  matchId?: number;
}

interface ExistingMatchData {
  matchId: number;
  originalPlayer1Hits: number;
  originalPlayer2Hits: number;
  originalWinner: string;
  player1Name: string;
  player2Name: string;
}

export default function BulkMatchEntry({ closeModal }: BulkMatchEntryProps) {
  const t = useTranslations("BulkEntry");
  const tPool = useTranslations("Pool");
  const context = useTournamentContext();
  const account = useUserContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const drawCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (drawCheckTimeoutRef.current) {
        clearTimeout(drawCheckTimeoutRef.current);
      }
    };
  }, []);

  const [cellData, setCellData] = useState<Map<string, CellData>>(new Map());
  const [pendingDraw, setPendingDraw] = useState<DrawMatch | null>(null);

  const players = useMemo(
    () => context.players.filter((p): p is Player => p !== null),
    [context.players],
  );

  const pools = context.pools;

  const areInSamePool = useCallback(
    (pIdx: number, opIdx: number): boolean => {
      if (pools.length === 0) return true;
      const p1 = players[pIdx];
      const p2 = players[opIdx];
      if (!p1 || !p2) return false;
      const p1PoolId = p1.player.pool_id;
      const p2PoolId = p2.player.pool_id;
      if (p1PoolId === null && p2PoolId === null) return true;
      return p1PoolId !== null && p1PoolId === p2PoolId;
    },
    [pools.length, players],
  );

  const { initialCellData, existingMatches } = useMemo(() => {
    const newCellData = new Map<string, CellData>();
    const newExistingMatches = new Map<string, ExistingMatchData>();
    const processed = new Set<string>();

    players.forEach((player, playerIndex) => {
      player.matches.forEach((match) => {
        if (match.round !== context.activeRound) return;

        const opponentName =
          match.player1 === player.player.player_name
            ? match.player2
            : match.player1;
        const opponentIndex = players.findIndex(
          (p) => p.player.player_name === opponentName,
        );

        if (opponentIndex === -1) return;

        const pairKey =
          playerIndex < opponentIndex
            ? `${playerIndex}-${opponentIndex}`
            : `${opponentIndex}-${playerIndex}`;
        if (processed.has(pairKey)) return;
        processed.add(pairKey);

        const isPlayer1 = match.player1 === player.player.player_name;
        const p1Index = isPlayer1 ? playerIndex : opponentIndex;
        const p2Index = isPlayer1 ? opponentIndex : playerIndex;

        const key1 = `${p1Index}-${p2Index}`;
        const key2 = `${p2Index}-${p1Index}`;

        newCellData.set(key1, {
          playerHits: match.player1_hits,
          opponentHits: match.player2_hits,
          winner: match.winner,
        });
        newCellData.set(key2, {
          playerHits: match.player2_hits,
          opponentHits: match.player1_hits,
          winner: match.winner,
        });

        const existingData: ExistingMatchData = {
          matchId: match.id,
          originalPlayer1Hits: match.player1_hits,
          originalPlayer2Hits: match.player2_hits,
          originalWinner: match.winner,
          player1Name: match.player1,
          player2Name: match.player2,
        };
        newExistingMatches.set(key1, existingData);
        newExistingMatches.set(key2, existingData);
      });
    });

    return { initialCellData: newCellData, existingMatches: newExistingMatches };
  }, [players, context.activeRound]);

  const getCellKey = useCallback(
    (playerIndex: number, opponentIndex: number) =>
      `${playerIndex}-${opponentIndex}`,
    [],
  );

  const navigateToNextCell = useCallback(
    (currentPlayerIndex: number, currentOpponentIndex: number) => {
      for (
        let opIdx = currentOpponentIndex + 1;
        opIdx < players.length;
        opIdx++
      ) {
        if (opIdx !== currentPlayerIndex) {
          const key = getCellKey(currentPlayerIndex, opIdx);
          const input = inputRefs.current.get(key);
          if (input) {
            input.focus();
            input.select();
            return;
          }
        }
      }

      for (let pIdx = currentPlayerIndex + 1; pIdx < players.length; pIdx++) {
        for (let opIdx = 0; opIdx < players.length; opIdx++) {
          if (opIdx !== pIdx) {
            const key = getCellKey(pIdx, opIdx);
            const input = inputRefs.current.get(key);
            if (input) {
              input.focus();
              input.select();
              return;
            }
          }
        }
      }
    },
    [players.length, getCellKey],
  );

  const handleKeyDown = useCallback(
    (
      e: KeyboardEvent<HTMLInputElement>,
      playerIndex: number,
      opponentIndex: number,
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        navigateToNextCell(playerIndex, opponentIndex);
      }
    },
    [navigateToNextCell],
  );

  const getMergedCellData = useCallback(
    (key: string): CellData | undefined => {
      const userData = cellData.get(key);
      const initialData = initialCellData.get(key);
      if (userData) return userData;
      return initialData;
    },
    [cellData, initialCellData],
  );

  const checkForDraw = useCallback(
    (
      playerIndex: number,
      opponentIndex: number,
      newCellData: Map<string, CellData>,
    ) => {
      const key = getCellKey(playerIndex, opponentIndex);
      const mirrorKey = getCellKey(opponentIndex, playerIndex);

      const userData = newCellData.get(key);
      const mirrorUserData = newCellData.get(mirrorKey);
      const initialData = initialCellData.get(key);
      const mirrorInitialData = initialCellData.get(mirrorKey);

      const data = userData || initialData;
      const mirrorData = mirrorUserData || mirrorInitialData;

      const player1Hits = data?.playerHits ?? mirrorData?.opponentHits;
      const player2Hits = data?.opponentHits ?? mirrorData?.playerHits;

      if (
        player1Hits !== "" &&
        player1Hits !== undefined &&
        player2Hits !== "" &&
        player2Hits !== undefined &&
        player1Hits === player2Hits
      ) {
        const existingWinner = data?.winner || mirrorData?.winner;
        if (!existingWinner) {
          setPendingDraw({
            playerIndex,
            opponentIndex,
            player1Name: players[playerIndex].player.player_name,
            player2Name: players[opponentIndex].player.player_name,
            hits: player1Hits as number,
          });
        }
      }
    },
    [getCellKey, players, initialCellData],
  );

  const handleCellChange = useCallback(
    (playerIndex: number, opponentIndex: number, value: string) => {
      const key = getCellKey(playerIndex, opponentIndex);
      const numValue = value === "" ? "" : parseInt(value, 10);

      if (
        typeof numValue === "number" &&
        (isNaN(numValue) || numValue < 0 || numValue > 99)
      ) {
        return;
      }

      let newCellData: Map<string, CellData>;

      setCellData((prev) => {
        newCellData = new Map(prev);
        const existing =
          newCellData.get(key) ||
          initialCellData.get(key) || {
            playerHits: "",
            opponentHits: "",
            winner: null,
          };
        newCellData.set(key, {
          ...existing,
          playerHits: numValue,
          winner: null,
        });

        const mirrorKey = getCellKey(opponentIndex, playerIndex);
        const mirrorExisting =
          newCellData.get(mirrorKey) ||
          initialCellData.get(mirrorKey) || {
            playerHits: "",
            opponentHits: "",
            winner: null,
          };
        newCellData.set(mirrorKey, {
          ...mirrorExisting,
          opponentHits: numValue,
          winner: null,
        });

        return newCellData;
      });

      if (drawCheckTimeoutRef.current) {
        clearTimeout(drawCheckTimeoutRef.current);
      }
      drawCheckTimeoutRef.current = setTimeout(() => {
        setCellData((current) => {
          checkForDraw(playerIndex, opponentIndex, current);
          return current;
        });
      }, 0);
    },
    [getCellKey, checkForDraw, initialCellData],
  );

  const handlePrioritySelection = useCallback(
    (winnerName: string) => {
      if (!pendingDraw) return;

      const { playerIndex, opponentIndex } = pendingDraw;
      const key = getCellKey(playerIndex, opponentIndex);
      const mirrorKey = getCellKey(opponentIndex, playerIndex);

      setCellData((prev) => {
        const newData = new Map(prev);

        const existing = newData.get(key) || {
          playerHits: "",
          opponentHits: "",
          winner: null,
        };
        newData.set(key, { ...existing, winner: winnerName });

        const mirrorExisting = newData.get(mirrorKey) || {
          playerHits: "",
          opponentHits: "",
          winner: null,
        };
        newData.set(mirrorKey, { ...mirrorExisting, winner: winnerName });

        return newData;
      });

      setPendingDraw(null);
    },
    [pendingDraw, getCellKey],
  );

  const getCellValue = useCallback(
    (playerIndex: number, opponentIndex: number): string => {
      const key = getCellKey(playerIndex, opponentIndex);
      const data = cellData.get(key);
      if (data && data.playerHits !== "") {
        return data.playerHits.toString();
      }
      const initial = initialCellData.get(key);
      if (initial && initial.playerHits !== "") {
        return initial.playerHits.toString();
      }
      return "";
    },
    [getCellKey, cellData, initialCellData],
  );

  const hasUnresolvedDraw = useCallback(
    (playerIndex: number, opponentIndex: number): boolean => {
      const key = getCellKey(playerIndex, opponentIndex);
      const mirrorKey = getCellKey(opponentIndex, playerIndex);

      const data = getMergedCellData(key);
      const mirrorData = getMergedCellData(mirrorKey);

      const player1Hits = data?.playerHits ?? mirrorData?.opponentHits;
      const player2Hits = data?.opponentHits ?? mirrorData?.playerHits;

      if (
        player1Hits !== "" &&
        player1Hits !== undefined &&
        player2Hits !== "" &&
        player2Hits !== undefined &&
        player1Hits === player2Hits
      ) {
        const existingWinner = data?.winner || mirrorData?.winner;
        return !existingWinner;
      }
      return false;
    },
    [getCellKey, getMergedCellData],
  );

  const getDrawWinner = useCallback(
    (playerIndex: number, opponentIndex: number): string | null => {
      const key = getCellKey(playerIndex, opponentIndex);
      const mirrorKey = getCellKey(opponentIndex, playerIndex);

      const data = getMergedCellData(key);
      const mirrorData = getMergedCellData(mirrorKey);

      return data?.winner || mirrorData?.winner || null;
    },
    [getCellKey, getMergedCellData],
  );

  const collectPendingMatches = useCallback((): PendingMatch[] => {
    const matches: PendingMatch[] = [];
    const processed = new Set<string>();

    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      for (let opIdx = 0; opIdx < players.length; opIdx++) {
        if (pIdx === opIdx) continue;
        if (!areInSamePool(pIdx, opIdx)) continue;

        const key = getCellKey(pIdx, opIdx);
        const mirrorKey = getCellKey(opIdx, pIdx);

        const pairKey =
          pIdx < opIdx ? `${pIdx}-${opIdx}` : `${opIdx}-${pIdx}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const data = getMergedCellData(key);
        const mirrorData = getMergedCellData(mirrorKey);

        const player1Hits = data?.playerHits ?? mirrorData?.opponentHits;
        const player2Hits = data?.opponentHits ?? mirrorData?.playerHits;

        if (
          player1Hits === "" ||
          player1Hits === undefined ||
          player2Hits === "" ||
          player2Hits === undefined
        ) {
          continue;
        }

        const p1Hits = typeof player1Hits === "number" ? player1Hits : 0;
        const p2Hits = typeof player2Hits === "number" ? player2Hits : 0;

        const existingData =
          existingMatches.get(key) || existingMatches.get(mirrorKey);

        let winner: string;
        if (p1Hits > p2Hits) {
          winner = players[pIdx].player.player_name;
        } else if (p2Hits > p1Hits) {
          winner = players[opIdx].player.player_name;
        } else {
          const selectedWinner = data?.winner || mirrorData?.winner;
          if (!selectedWinner) continue;
          winner = selectedWinner;
        }

        if (existingData) {
          const isP1First =
            existingData.player1Name === players[pIdx].player.player_name;
          const originalP1Hits = existingData.originalPlayer1Hits;
          const originalP2Hits = existingData.originalPlayer2Hits;

          const newP1Hits = isP1First ? p1Hits : p2Hits;
          const newP2Hits = isP1First ? p2Hits : p1Hits;

          if (
            originalP1Hits !== newP1Hits ||
            originalP2Hits !== newP2Hits ||
            existingData.originalWinner !== winner
          ) {
            matches.push({
              player1: existingData.player1Name,
              player2: existingData.player2Name,
              player1_hits: newP1Hits,
              player2_hits: newP2Hits,
              winner,
              matchId: existingData.matchId,
            });
          }
        } else {
          matches.push({
            player1: players[pIdx].player.player_name,
            player2: players[opIdx].player.player_name,
            player1_hits: p1Hits,
            player2_hits: p2Hits,
            winner,
          });
        }
      }
    }

    return matches;
  }, [players, getMergedCellData, getCellKey, existingMatches, areInSamePool]);

  const countUnresolvedDraws = useCallback((): number => {
    let count = 0;
    const processed = new Set<string>();

    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      for (let opIdx = 0; opIdx < players.length; opIdx++) {
        if (pIdx === opIdx) continue;
        if (!areInSamePool(pIdx, opIdx)) continue;

        const pairKey =
          pIdx < opIdx ? `${pIdx}-${opIdx}` : `${opIdx}-${pIdx}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        if (hasUnresolvedDraw(pIdx, opIdx)) {
          count++;
        }
      }
    }
    return count;
  }, [players, hasUnresolvedDraw, areInSamePool]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccessCount(0);

    const pendingMatches = collectPendingMatches();

    if (pendingMatches.length === 0) {
      setError(t("noMatchesToSubmit"));
      setLoading(false);
      return;
    }

    let submitted = 0;
    const errors: string[] = [];

    for (const match of pendingMatches) {
      const isUpdate = match.matchId !== undefined;

      const matchData: NewMatch = {
        match: 1,
        player1: match.player1,
        player2: match.player2,
        player1_hits: match.player1_hits,
        player2_hits: match.player2_hits,
        winner: match.winner,
        tournament_id: context.tournament!.id,
        round: context.activeRound,
      };

      try {
        const res = await fetch("/api/matches", {
          method: isUpdate ? "PUT" : "POST",
          body: JSON.stringify(matchData),
        });

        if (res.ok) {
          submitted++;
          const matchRow: MatchRow = await res.json();

          context.setPlayers((prevPlayers) => {
            return prevPlayers.map((player) => {
              if (!player) return player;
              if (
                player.player.player_name !== match.player1 &&
                player.player.player_name !== match.player2
              ) {
                return player;
              }

              if (isUpdate) {
                return {
                  player: player.player,
                  matches: player.matches.map((m) =>
                    m.id === match.matchId ? matchRow : m,
                  ),
                };
              } else {
                return {
                  player: player.player,
                  matches: [...player.matches, matchRow],
                };
              }
            });
          });
        } else if (res.status === 409) {
          errors.push(`${match.player1} vs ${match.player2}: ${t("matchExists")}`);
        } else {
          errors.push(
            `${match.player1} vs ${match.player2}: ${t("submitFailed")}`,
          );
        }
      } catch {
        errors.push(
          `${match.player1} vs ${match.player2}: ${t("networkError")}`,
        );
      }
    }

    setSuccessCount(submitted);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    setLoading(false);

    if (submitted > 0 && errors.length === 0) {
      closeModal();
    }
  }, [collectPendingMatches, context, closeModal, t]);

  const pendingCount = collectPendingMatches().length;
  const unresolvedDraws = countUnresolvedDraws();

  if (account.user?.role !== "admin") {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-red-600 mb-4">
          {t("unauthorized")}
        </h1>
        <Button onClick={closeModal} variant="secondary">
          {t("back")}
        </Button>
      </div>
    );
  }

  const renderTables = () => {
    const playersWithIndex: PlayerWithIndex[] = players.map((p, i) => ({
      player: p,
      globalIndex: i,
    }));

    const tableProps = {
      getCellKey,
      getCellValue,
      hasUnresolvedDraw,
      getDrawWinner,
      getMergedCellData,
      onCellChange: handleCellChange,
      onKeyDown: handleKeyDown,
      inputRefs,
    };

    if (pools.length === 0) {
      return <MatchTable poolPlayers={playersWithIndex} {...tableProps} />;
    }

    const unassigned = playersWithIndex.filter(
      ({ player }) => player.player.pool_id === null,
    );

    return (
      <>
        {pools.map((pool) => {
          const poolPlayers = playersWithIndex.filter(
            ({ player }) => player.player.pool_id === pool.id,
          );
          if (poolPlayers.length === 0) return null;
          return (
            <div key={pool.id}>
              {pools.length > 1 && (
                <h2 className="text-lg font-semibold mb-2 text-gray-700">
                  {pool.name}
                </h2>
              )}
              <MatchTable poolPlayers={poolPlayers} {...tableProps} />
            </div>
          );
        })}
        {unassigned.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">
              {tPool("unassigned")}
            </h2>
            <MatchTable poolPlayers={unassigned} {...tableProps} />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="max-h-[80vh] overflow-auto p-1">
      <h1 className="mb-4 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {t("title")} - {t("round")} {context.activeRound}
      </h1>
      <p className="mb-4 text-center text-sm text-gray-600">
        {t("instructions")}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
          {error}
        </div>
      )}

      {successCount > 0 && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {t("submitted", { count: successCount })}
        </div>
      )}

      {pendingDraw && (
        <DrawWinnerDialog
          pendingDraw={pendingDraw}
          onSelectWinner={handlePrioritySelection}
          onCancel={() => setPendingDraw(null)}
        />
      )}

      {renderTables()}

      <div className="text-center text-sm text-gray-600 mb-4">
        {t("pendingMatches", { count: pendingCount })}
        {unresolvedDraws > 0 && (
          <span className="text-yellow-600 ml-2">
            ({t("unresolvedDraws", { count: unresolvedDraws })})
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
        <Button
          disabled={loading || pendingCount === 0}
          onClick={handleSubmit}
          variant="primary"
          fullWidth
        >
          {loading ? t("submitting") : t("submit")}
        </Button>
        <Button onClick={closeModal} variant="secondary" fullWidth>
          {t("back")}
        </Button>
      </div>
    </div>
  );
}
