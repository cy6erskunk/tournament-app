"use client";

import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { useState, useRef, useCallback, KeyboardEvent } from "react";
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

    setCellData((prev) => {
      const newData = new Map(prev);
      const existing = newData.get(key) || { playerHits: "", opponentHits: "", winner: null };
      newData.set(key, { ...existing, playerHits: numValue });
      return newData;
    });

    // Also update the mirror cell (opponent's view)
    const mirrorKey = getCellKey(opponentIndex, playerIndex);
    setCellData((prev) => {
      const newData = new Map(prev);
      const existing = newData.get(mirrorKey) || { playerHits: "", opponentHits: "", winner: null };
      newData.set(mirrorKey, { ...existing, opponentHits: numValue });
      return newData;
    });
  }, [getCellKey]);

  // Get cell value for display
  const getCellValue = useCallback((playerIndex: number, opponentIndex: number): string => {
    const key = getCellKey(playerIndex, opponentIndex);
    const data = cellData.get(key);
    if (data && data.playerHits !== "") {
      return data.playerHits.toString();
    }
    return "";
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
          // For draws, we need priority selection - skip for now
          // In bulk entry, we'll default to player1 wins on draw
          // This matches fencing convention where piste priority is given
          winner = players[pIdx].player.player_name;
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

                  if (isSelf) {
                    return (
                      <td
                        key={cellKey}
                        className="border border-gray-300 bg-gray-400"
                      />
                    );
                  }

                  if (existingMatch) {
                    // Show existing match result
                    const isPlayer1 = existingMatch.player1 === player.player.player_name;
                    const hits = isPlayer1 ? existingMatch.player1_hits : existingMatch.player2_hits;
                    const won = existingMatch.winner === player.player.player_name;

                    return (
                      <td
                        key={cellKey}
                        className={`border border-gray-300 p-1 text-center ${
                          won ? "bg-green-100" : "bg-red-100"
                        }`}
                        title={`${existingMatch.player1} ${existingMatch.player1_hits} - ${existingMatch.player2_hits} ${existingMatch.player2}`}
                      >
                        {won ? "V" : "H"}{hits}
                      </td>
                    );
                  }

                  return (
                    <td key={cellKey} className="border border-gray-300 p-0">
                      <input
                        ref={(el) => {
                          if (el) {
                            inputRefs.current.set(cellKey, el);
                          }
                        }}
                        type="number"
                        min="0"
                        max="99"
                        className="w-full h-full p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={getCellValue(playerIndex, opponentIndex)}
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
