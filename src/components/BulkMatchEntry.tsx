"use client";

import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
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
}

interface DrawMatch {
  playerIndex: number;
  opponentIndex: number;
  player1Name: string;
  player2Name: string;
  hits: number;
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

  // Track cell data: key is "playerIndex-opponentIndex"
  const [cellData, setCellData] = useState<Map<string, CellData>>(new Map());

  // Track draw that needs priority selection
  const [pendingDraw, setPendingDraw] = useState<DrawMatch | null>(null);

  // Build list of valid players
  const players = context.players.filter((p): p is Player => p !== null);

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

  // Check if match already exists between two players
  const matchExists = useCallback((player: Player, opponent: Player): boolean => {
    return player.matches.some(
      (match) =>
        match.round === context.activeRound &&
        ((match.player1 === player.player.player_name && match.player2 === opponent.player.player_name) ||
          (match.player1 === opponent.player.player_name && match.player2 === player.player.player_name))
    );
  }, [context.activeRound]);

  // Get existing match data between two players
  const getExistingMatch = useCallback((player: Player, opponent: Player): MatchRow | undefined => {
    return player.matches.find(
      (match) =>
        match.round === context.activeRound &&
        ((match.player1 === player.player.player_name && match.player2 === opponent.player.player_name) ||
          (match.player1 === opponent.player.player_name && match.player2 === player.player.player_name))
    );
  }, [context.activeRound]);

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

    const data = newCellData.get(key);
    const mirrorData = newCellData.get(mirrorKey);

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
  }, [getCellKey, players]);

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
      const existing = newCellData.get(key) || { playerHits: "", opponentHits: "", winner: null };
      // Clear winner if score changes
      newCellData.set(key, { ...existing, playerHits: numValue, winner: null });

      // Also update the mirror cell (opponent's view)
      const mirrorKey = getCellKey(opponentIndex, playerIndex);
      const mirrorExisting = newCellData.get(mirrorKey) || { playerHits: "", opponentHits: "", winner: null };
      // Clear winner on mirror too
      newCellData.set(mirrorKey, { ...mirrorExisting, opponentHits: numValue, winner: null });

      return newCellData;
    });

    // Check for draw after state update
    setTimeout(() => {
      setCellData((current) => {
        checkForDraw(playerIndex, opponentIndex, current);
        return current;
      });
    }, 0);
  }, [getCellKey, checkForDraw]);

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

  // Get cell value for display
  const getCellValue = useCallback((playerIndex: number, opponentIndex: number): string => {
    const key = getCellKey(playerIndex, opponentIndex);
    const data = cellData.get(key);
    if (data && data.playerHits !== "") {
      return data.playerHits.toString();
    }
    return "";
  }, [getCellKey, cellData]);

  // Check if a cell pair has a draw without winner selected
  const hasUnresolvedDraw = useCallback((playerIndex: number, opponentIndex: number): boolean => {
    const key = getCellKey(playerIndex, opponentIndex);
    const mirrorKey = getCellKey(opponentIndex, playerIndex);

    const data = cellData.get(key);
    const mirrorData = cellData.get(mirrorKey);

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
  }, [getCellKey, cellData]);

  // Get the winner for a draw cell (for display)
  const getDrawWinner = useCallback((playerIndex: number, opponentIndex: number): string | null => {
    const key = getCellKey(playerIndex, opponentIndex);
    const mirrorKey = getCellKey(opponentIndex, playerIndex);

    const data = cellData.get(key);
    const mirrorData = cellData.get(mirrorKey);

    return data?.winner || mirrorData?.winner || null;
  }, [getCellKey, cellData]);

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

        const data = cellData.get(key);
        const mirrorData = cellData.get(mirrorKey);

        // Get hits for both players
        const player1Hits = data?.playerHits ?? mirrorData?.opponentHits;
        const player2Hits = data?.opponentHits ?? mirrorData?.playerHits;

        // Skip if no data entered for this pair
        if (player1Hits === "" || player1Hits === undefined ||
            player2Hits === "" || player2Hits === undefined) {
          continue;
        }

        // Skip if match already exists
        if (matchExists(players[pIdx], players[opIdx])) {
          continue;
        }

        const p1Hits = typeof player1Hits === "number" ? player1Hits : 0;
        const p2Hits = typeof player2Hits === "number" ? player2Hits : 0;

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

        matches.push({
          player1: players[pIdx].player.player_name,
          player2: players[opIdx].player.player_name,
          player1_hits: p1Hits,
          player2_hits: p2Hits,
          winner,
        });
      }
    }

    return matches;
  }, [players, cellData, getCellKey, matchExists]);

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
      const newMatch: NewMatch = {
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
          method: "POST",
          body: JSON.stringify(newMatch),
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
              return {
                player: player.player,
                matches: [...player.matches, matchRow],
              };
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
          onClick={closeModal}
          className="ring-2 ring-gray-900 ring-inset py-2 px-4 rounded-md shadow-xs"
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
                onClick={() => handlePrioritySelection(pendingDraw.player1Name)}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
              >
                {pendingDraw.player1Name}
              </button>
              <button
                onClick={() => handlePrioritySelection(pendingDraw.player2Name)}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md"
              >
                {pendingDraw.player2Name}
              </button>
              <button
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
                  const existingMatch = getExistingMatch(player, opponent);
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

                  if (existingMatch) {
                    // Show existing match result using standard fencing notation
                    const isPlayer1 = existingMatch.player1 === player.player.player_name;
                    const hits = isPlayer1 ? existingMatch.player1_hits : existingMatch.player2_hits;
                    const won = existingMatch.winner === player.player.player_name;

                    // Format: V for win with 5 hits, V+score otherwise, score only for loss
                    const displayValue = won
                      ? (hits === 5 ? "V" : `V${hits}`)
                      : hits.toString();

                    return (
                      <td
                        key={cellKey}
                        className={`border border-gray-300 p-1 text-center ${
                          won ? "bg-green-100" : "bg-red-100"
                        }`}
                        title={`${existingMatch.player1} ${existingMatch.player1_hits} - ${existingMatch.player2_hits} ${existingMatch.player2}`}
                      >
                        {displayValue}
                      </td>
                    );
                  }

                  // Check if this is a draw with winner selected
                  const cellValue = getCellValue(playerIndex, opponentIndex);
                  const isDrawWithWinner = drawWinner && cellValue !== "";

                  // For draws with winner, show V notation
                  if (isDrawWithWinner) {
                    const won = drawWinner === player.player.player_name;
                    const hits = parseInt(cellValue, 10);
                    const displayValue = won ? `V${hits}` : hits.toString();

                    return (
                      <td
                        key={cellKey}
                        className={`border border-gray-300 p-1 text-center ${
                          won ? "bg-green-100" : "bg-red-100"
                        }`}
                        title={`${t("winner")}: ${drawWinner}`}
                      >
                        {displayValue}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={cellKey}
                      className={`border border-gray-300 p-0 ${
                        unresolvedDraw ? "bg-yellow-100" : ""
                      }`}
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
                        className={`w-full h-full p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          unresolvedDraw ? "bg-yellow-100" : ""
                        }`}
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
          disabled={loading || pendingCount === 0}
          onClick={handleSubmit}
          className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-xs"
        >
          {loading ? t("submitting") : t("submit")}
        </button>
        <button
          type="button"
          onClick={closeModal}
          className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-xs"
        >
          {t("back")}
        </button>
      </div>
    </div>
  );
}
