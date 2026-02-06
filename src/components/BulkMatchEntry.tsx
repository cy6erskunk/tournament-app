"use client";

import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { useState, useRef, useCallback, KeyboardEvent, useMemo, useEffect } from "react";
import { MatchRow, NewMatch } from "@/types/MatchTypes";
import { Player } from "@/types/Player";

interface BulkMatchEntryProps {
  closeModal: () => void;
}

interface CellData {
  playerHits: number | "";
  opponentHits: number | "";
  winner: string | null;
}

interface PendingMatch {
  player1: string;
  player2: string;
  player1_hits: number;
  player2_hits: number;
  winner: string;
  matchId?: number; // For existing matches that need updating
}

interface DrawMatch {
  playerIndex: number;
  opponentIndex: number;
  player1Name: string;
  player2Name: string;
  hits: number;
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
  const context = useTournamentContext();
  const account = useUserContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  // Store refs for all input cells
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Track timeout for cleanup
  const drawCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (drawCheckTimeoutRef.current) {
        clearTimeout(drawCheckTimeoutRef.current);
      }
    };
  }, []);

  // Track cell data: key is "playerIndex-opponentIndex"
  const [cellData, setCellData] = useState<Map<string, CellData>>(new Map());

  // Track draw that needs priority selection
  const [pendingDraw, setPendingDraw] = useState<DrawMatch | null>(null);

  // Build list of valid players - memoize to avoid infinite loops
  const players = useMemo(
    () => context.players.filter((p): p is Player => p !== null),
    [context.players]
  );

  // Compute existing matches data from context (derived, not state)
  const { initialCellData, existingMatches } = useMemo(() => {
    const newCellData = new Map<string, CellData>();
    const newExistingMatches = new Map<string, ExistingMatchData>();
    const processed = new Set<string>();

    players.forEach((player, playerIndex) => {
      player.matches.forEach((match) => {
        if (match.round !== context.activeRound) return;

        // Find opponent index
        const opponentName = match.player1 === player.player.player_name
          ? match.player2
          : match.player1;
        const opponentIndex = players.findIndex(
          (p) => p.player.player_name === opponentName
        );

        if (opponentIndex === -1) return;

        // Skip if already processed this pair
        const pairKey = playerIndex < opponentIndex
          ? `${playerIndex}-${opponentIndex}`
          : `${opponentIndex}-${playerIndex}`;
        if (processed.has(pairKey)) return;
        processed.add(pairKey);

        const isPlayer1 = match.player1 === player.player.player_name;
        const p1Index = isPlayer1 ? playerIndex : opponentIndex;
        const p2Index = isPlayer1 ? opponentIndex : playerIndex;

        const key1 = `${p1Index}-${p2Index}`;
        const key2 = `${p2Index}-${p1Index}`;

        // Set cell data for both directions
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

        // Track existing match for PUT requests
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

  // Get cell key
  const getCellKey = useCallback((playerIndex: number, opponentIndex: number) =>
    `${playerIndex}-${opponentIndex}`, []);

  // Navigate to next cell
  const navigateToNextCell = useCallback((currentPlayerIndex: number, currentOpponentIndex: number) => {
    // Find next valid cell in the same row
    for (let opIdx = currentOpponentIndex + 1; opIdx < players.length; opIdx++) {
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

    // Move to next row
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
  }, [players.length, getCellKey]);
  // Handle key press in cell
  const handleKeyDown = useCallback((
    e: KeyboardEvent<HTMLInputElement>,
    playerIndex: number,
    opponentIndex: number
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateToNextCell(playerIndex, opponentIndex);
    }
  }, [navigateToNextCell]);

  // Check for draw and show priority dialog if needed
  const checkForDraw = useCallback((
    playerIndex: number,
    opponentIndex: number,
    newCellData: Map<string, CellData>
  ) => {
    const key = getCellKey(playerIndex, opponentIndex);
    const mirrorKey = getCellKey(opponentIndex, playerIndex);

    // Merge with initial data - user input takes precedence
    const userData = newCellData.get(key);
    const mirrorUserData = newCellData.get(mirrorKey);
    const initialData = initialCellData.get(key);
    const mirrorInitialData = initialCellData.get(mirrorKey);

    const data = userData || initialData;
    const mirrorData = mirrorUserData || mirrorInitialData;

    // Get hits for both players
    const player1Hits = data?.playerHits ?? mirrorData?.opponentHits;
    const player2Hits = data?.opponentHits ?? mirrorData?.playerHits;

    // Check if we have both values and they're equal
    if (
      player1Hits !== "" && player1Hits !== undefined &&
      player2Hits !== "" && player2Hits !== undefined &&
      player1Hits === player2Hits
    ) {
      // Check if winner is already set
      const existingWinner = data?.winner || mirrorData?.winner;
      if (!existingWinner) {
        // Show priority dialog
        setPendingDraw({
          playerIndex,
          opponentIndex,
          player1Name: players[playerIndex].player.player_name,
          player2Name: players[opponentIndex].player.player_name,
          hits: player1Hits as number,
        });
      }
    }
  }, [getCellKey, players, initialCellData]);

  // Handle cell value change
  const handleCellChange = useCallback((
    playerIndex: number,
    opponentIndex: number,
    value: string
  ) => {
    const key = getCellKey(playerIndex, opponentIndex);
    const numValue = value === "" ? "" : parseInt(value, 10);

    if (typeof numValue === "number" && (isNaN(numValue) || numValue < 0 || numValue > 99)) {
      return;
    }

    let newCellData: Map<string, CellData>;

    setCellData((prev) => {
      newCellData = new Map(prev);
      // Fall back to initialCellData for existing matches
      const existing = newCellData.get(key) || initialCellData.get(key) || { playerHits: "", opponentHits: "", winner: null };
      // Clear winner if score changes
      newCellData.set(key, { ...existing, playerHits: numValue, winner: null });

      // Also update the mirror cell (opponent's view)
      const mirrorKey = getCellKey(opponentIndex, playerIndex);
      const mirrorExisting = newCellData.get(mirrorKey) || initialCellData.get(mirrorKey) || { playerHits: "", opponentHits: "", winner: null };
      // Clear winner on mirror too
      newCellData.set(mirrorKey, { ...mirrorExisting, opponentHits: numValue, winner: null });

      return newCellData;
    });

    // Check for draw after state update
    if (drawCheckTimeoutRef.current) {
      clearTimeout(drawCheckTimeoutRef.current);
    }
    drawCheckTimeoutRef.current = setTimeout(() => {
      setCellData((current) => {
        checkForDraw(playerIndex, opponentIndex, current);
        return current;
      });
    }, 0);
  }, [getCellKey, checkForDraw, initialCellData]);

  // Handle priority winner selection
  const handlePrioritySelection = useCallback((winnerName: string) => {
    if (!pendingDraw) return;

    const { playerIndex, opponentIndex } = pendingDraw;
    const key = getCellKey(playerIndex, opponentIndex);
    const mirrorKey = getCellKey(opponentIndex, playerIndex);

    setCellData((prev) => {
      const newData = new Map(prev);

      const existing = newData.get(key) || { playerHits: "", opponentHits: "", winner: null };
      newData.set(key, { ...existing, winner: winnerName });

      const mirrorExisting = newData.get(mirrorKey) || { playerHits: "", opponentHits: "", winner: null };
      newData.set(mirrorKey, { ...mirrorExisting, winner: winnerName });

      return newData;
    });

    setPendingDraw(null);
  }, [pendingDraw, getCellKey]);

  // Get cell value for display - check user input first, then initial data
  const getCellValue = useCallback((playerIndex: number, opponentIndex: number): string => {
    const key = getCellKey(playerIndex, opponentIndex);
    // Check user-entered data first
    const data = cellData.get(key);
    if (data && data.playerHits !== "") {
      return data.playerHits.toString();
    }
    // Fall back to initial data from existing matches
    const initial = initialCellData.get(key);
    if (initial && initial.playerHits !== "") {
      return initial.playerHits.toString();
    }
    return "";
  }, [getCellKey, cellData, initialCellData]);

  // Check if a cell pair has a draw without winner selected
  // Helper to get merged cell data (user input takes precedence over initial)
  const getMergedCellData = useCallback((key: string): CellData | undefined => {
    const userData = cellData.get(key);
    const initialData = initialCellData.get(key);
    if (userData) return userData;
    return initialData;
  }, [cellData, initialCellData]);

  const hasUnresolvedDraw = useCallback((playerIndex: number, opponentIndex: number): boolean => {
    const key = getCellKey(playerIndex, opponentIndex);
    const mirrorKey = getCellKey(opponentIndex, playerIndex);

    const data = getMergedCellData(key);
    const mirrorData = getMergedCellData(mirrorKey);

    const player1Hits = data?.playerHits ?? mirrorData?.opponentHits;
    const player2Hits = data?.opponentHits ?? mirrorData?.playerHits;

    if (
      player1Hits !== "" && player1Hits !== undefined &&
      player2Hits !== "" && player2Hits !== undefined &&
      player1Hits === player2Hits
    ) {
      const existingWinner = data?.winner || mirrorData?.winner;
      return !existingWinner;
    }
    return false;
  }, [getCellKey, getMergedCellData]);

  // Get the winner for a draw cell (for display)
  const getDrawWinner = useCallback((playerIndex: number, opponentIndex: number): string | null => {
    const key = getCellKey(playerIndex, opponentIndex);
    const mirrorKey = getCellKey(opponentIndex, playerIndex);

    const data = getMergedCellData(key);
    const mirrorData = getMergedCellData(mirrorKey);

    return data?.winner || mirrorData?.winner || null;
  }, [getCellKey, getMergedCellData]);

  // Collect all pending matches from cell data
  const collectPendingMatches = useCallback((): PendingMatch[] => {
    const matches: PendingMatch[] = [];
    const processed = new Set<string>();

    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      for (let opIdx = 0; opIdx < players.length; opIdx++) {
        if (pIdx === opIdx) continue;

        const key = getCellKey(pIdx, opIdx);
        const mirrorKey = getCellKey(opIdx, pIdx);

        // Skip if already processed this pair
        const pairKey = pIdx < opIdx ? `${pIdx}-${opIdx}` : `${opIdx}-${pIdx}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        const data = getMergedCellData(key);
        const mirrorData = getMergedCellData(mirrorKey);

        // Get hits for both players
        const player1Hits = data?.playerHits ?? mirrorData?.opponentHits;
        const player2Hits = data?.opponentHits ?? mirrorData?.playerHits;

        // Skip if no data entered for this pair
        if (player1Hits === "" || player1Hits === undefined ||
            player2Hits === "" || player2Hits === undefined) {
          continue;
        }

        const p1Hits = typeof player1Hits === "number" ? player1Hits : 0;
        const p2Hits = typeof player2Hits === "number" ? player2Hits : 0;

        // Check if this is an existing match
        const existingData = existingMatches.get(key) || existingMatches.get(mirrorKey);

        // Determine winner
        let winner: string;
        if (p1Hits > p2Hits) {
          winner = players[pIdx].player.player_name;
        } else if (p2Hits > p1Hits) {
          winner = players[opIdx].player.player_name;
        } else {
          // Draw - need priority selection
          const selectedWinner = data?.winner || mirrorData?.winner;
          if (!selectedWinner) {
            // Skip matches without winner selected for draws
            continue;
          }
          winner = selectedWinner;
        }

        if (existingData) {
          // This is an existing match - check if values have changed
          // Get the correct p1/p2 hits based on the original player order
          const isP1First = existingData.player1Name === players[pIdx].player.player_name;
          const originalP1Hits = existingData.originalPlayer1Hits;
          const originalP2Hits = existingData.originalPlayer2Hits;

          const newP1Hits = isP1First ? p1Hits : p2Hits;
          const newP2Hits = isP1First ? p2Hits : p1Hits;

          if (
            originalP1Hits !== newP1Hits ||
            originalP2Hits !== newP2Hits ||
            existingData.originalWinner !== winner
          ) {
            // Values changed - include for update
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
          // New match
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
  }, [players, getMergedCellData, getCellKey, existingMatches]);

  // Count draws that need resolution
  const countUnresolvedDraws = useCallback((): number => {
    let count = 0;
    const processed = new Set<string>();

    for (let pIdx = 0; pIdx < players.length; pIdx++) {
      for (let opIdx = 0; opIdx < players.length; opIdx++) {
        if (pIdx === opIdx) continue;

        const pairKey = pIdx < opIdx ? `${pIdx}-${opIdx}` : `${opIdx}-${pIdx}`;
        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        if (hasUnresolvedDraw(pIdx, opIdx)) {
          count++;
        }
      }
    }
    return count;
  }, [players, hasUnresolvedDraw]);

  // Submit all matches
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
        const url = "/api/matches";
        const res = await fetch(url, {
          method: isUpdate ? "PUT" : "POST",
          body: JSON.stringify(matchData),
        });

        if (res.ok) {
          submitted++;
          const matchRow: MatchRow = await res.json();

          // Update context
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
                // Replace existing match
                return {
                  player: player.player,
                  matches: player.matches.map((m) =>
                    m.id === match.matchId ? matchRow : m
                  ),
                };
              } else {
                // Add new match
                return {
                  player: player.player,
                  matches: [...player.matches, matchRow],
                };
              }
            });
          });
        } else if (res.status === 409) {
          // Match already exists, skip
          errors.push(`${match.player1} vs ${match.player2}: ${t("matchExists")}`);
        } else {
          errors.push(`${match.player1} vs ${match.player2}: ${t("submitFailed")}`);
        }
      } catch {
        errors.push(`${match.player1} vs ${match.player2}: ${t("networkError")}`);
      }
    }

    setSuccessCount(submitted);

    if (errors.length > 0) {
      setError(errors.join("\n"));
    }

    setLoading(false);

    if (submitted > 0 && errors.length === 0) {
      // Close modal on full success
      closeModal();
    }
  }, [collectPendingMatches, context, closeModal, t]);

  // Count pending matches
  const pendingCount = collectPendingMatches().length;
  const unresolvedDraws = countUnresolvedDraws();

  // Check if user is admin - must be after all hooks
  if (account.user?.role !== "admin") {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold text-red-600 mb-4">{t("unauthorized")}</h1>
        <button
          type="button"
          onClick={closeModal}
          className="ring-2 ring-gray-900 ring-inset py-2 px-4 rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-h-[80vh] overflow-auto">
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

      {/* Winner Selection Dialog for Draws */}
      {pendingDraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-center">{t("selectWinner")}</h2>
            <p className="text-center mb-4 text-gray-600">
              {pendingDraw.player1Name} {pendingDraw.hits} - {pendingDraw.hits} {pendingDraw.player2Name}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handlePrioritySelection(pendingDraw.player1Name)}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
              >
                {pendingDraw.player1Name}
              </button>
              <button
                type="button"
                onClick={() => handlePrioritySelection(pendingDraw.player2Name)}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
              >
                {pendingDraw.player2Name}
              </button>
              <button
                type="button"
                onClick={() => setPendingDraw(null)}
                className="w-full py-2 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-md"
              >
                {t("back")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 sticky left-0 bg-gray-100 z-10">
                {t("player")}
              </th>
              {players.map((_, index) => (
                <th key={index} className="border border-gray-300 p-2 w-12 min-w-12">
                  {index + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, playerIndex) => (
              <tr key={player.player.player_name}>
                <td className="border border-gray-300 p-2 font-medium sticky left-0 bg-white z-10">
                  <span className="text-gray-500 mr-2">{playerIndex + 1}.</span>
                  {player.player.player_name}
                </td>
                {players.map((opponent, opponentIndex) => {
                  const isSelf = playerIndex === opponentIndex;
                  const cellKey = getCellKey(playerIndex, opponentIndex);
                  const unresolvedDraw = hasUnresolvedDraw(playerIndex, opponentIndex);
                  const drawWinner = getDrawWinner(playerIndex, opponentIndex);

                  if (isSelf) {
                    return (
                      <td
                        key={cellKey}
                        className="border border-gray-300 bg-gray-400"
                      />
                    );
                  }

                  // Get cell value
                  const cellValue = getCellValue(playerIndex, opponentIndex);
                  const hasValue = cellValue !== "";

                  // Determine background color based on win/loss state
                  let bgColor = "";

                  if (hasValue && drawWinner) {
                    // Draw with winner selected
                    const isWinner = drawWinner === player.player.player_name;
                    bgColor = isWinner ? "bg-green-100" : "bg-red-100";
                  } else if (hasValue && !unresolvedDraw) {
                    // Check if there's opponent data to determine winner
                    const mirrorKey = getCellKey(opponentIndex, playerIndex);
                    const data = getMergedCellData(cellKey);
                    const mirrorData = getMergedCellData(mirrorKey);

                    const playerHits = data?.playerHits ?? mirrorData?.opponentHits;
                    const opponentHits = data?.opponentHits ?? mirrorData?.playerHits;

                    if (
                      playerHits !== "" && playerHits !== undefined &&
                      opponentHits !== "" && opponentHits !== undefined
                    ) {
                      if (playerHits > opponentHits) {
                        bgColor = "bg-green-100";
                      } else if (playerHits < opponentHits) {
                        bgColor = "bg-red-100";
                      }
                    }
                  } else if (unresolvedDraw) {
                    bgColor = "bg-yellow-100";
                  }

                  return (
                    <td
                      key={cellKey}
                      className={`border border-gray-300 p-0 ${bgColor}`}
                    >
                      <input
                        ref={(el) => {
                          if (el) {
                            inputRefs.current.set(cellKey, el);
                          }
                        }}
                        type="number"
                        min="0"
                        max="99"
                        className={`w-full h-full p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${bgColor}`}
                        value={cellValue}
                        onChange={(e) =>
                          handleCellChange(playerIndex, opponentIndex, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, playerIndex, opponentIndex)}
                        placeholder=""
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center text-sm text-gray-600 mb-4">
        {t("pendingMatches", { count: pendingCount })}
        {unresolvedDraws > 0 && (
          <span className="text-yellow-600 ml-2">
            ({t("unresolvedDraws", { count: unresolvedDraws })})
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
        <button
          type="button"
          disabled={loading || pendingCount === 0}
          onClick={handleSubmit}
          className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
        <button
          type="button"
          onClick={closeModal}
          className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
        >
          {t("back")}
        </button>
      </div>
    </div>
  );
}
