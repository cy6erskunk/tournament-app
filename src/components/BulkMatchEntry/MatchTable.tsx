"use client";

import { KeyboardEvent, MutableRefObject } from "react";
import { useTranslations } from "next-intl";
import type { CellData, PlayerWithIndex } from "./types";

interface MatchTableProps {
  poolPlayers: PlayerWithIndex[];
  getCellKey: (playerIndex: number, opponentIndex: number) => string;
  getCellValue: (playerIndex: number, opponentIndex: number) => string;
  hasUnresolvedDraw: (playerIndex: number, opponentIndex: number) => boolean;
  getDrawWinner: (playerIndex: number, opponentIndex: number) => string | null;
  getMergedCellData: (key: string) => CellData | undefined;
  onCellChange: (
    playerIndex: number,
    opponentIndex: number,
    value: string,
  ) => void;
  onKeyDown: (
    e: KeyboardEvent<HTMLInputElement>,
    playerIndex: number,
    opponentIndex: number,
  ) => void;
  inputRefs: MutableRefObject<Map<string, HTMLInputElement>>;
}

export function MatchTable({
  poolPlayers,
  getCellKey,
  getCellValue,
  hasUnresolvedDraw,
  getDrawWinner,
  getMergedCellData,
  onCellChange,
  onKeyDown,
  inputRefs,
}: MatchTableProps) {
  const t = useTranslations("BulkEntry");

  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 sticky left-0 bg-gray-100 z-10">
              {t("player")}
            </th>
            {poolPlayers.map(({ globalIndex }) => (
              <th
                key={globalIndex}
                className="border border-gray-300 p-2 w-12 min-w-12"
              >
                {globalIndex + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {poolPlayers.map(({ player, globalIndex: playerIndex }) => (
            <tr key={player.player.player_name}>
              <td className="border border-gray-300 p-2 font-medium sticky left-0 bg-white z-10">
                <span className="text-gray-500 mr-2">{playerIndex + 1}.</span>
                {player.player.player_name}
              </td>
              {poolPlayers.map(({ globalIndex: opponentIndex }) => {
                const isSelf = playerIndex === opponentIndex;
                const cellKey = getCellKey(playerIndex, opponentIndex);
                const unresolvedDraw = hasUnresolvedDraw(
                  playerIndex,
                  opponentIndex,
                );
                const drawWinner = getDrawWinner(playerIndex, opponentIndex);

                if (isSelf) {
                  return (
                    <td
                      key={cellKey}
                      className="border border-gray-300 bg-gray-400"
                    />
                  );
                }

                const cellValue = getCellValue(playerIndex, opponentIndex);
                const hasValue = cellValue !== "";

                let bgColor = "";
                if (hasValue && drawWinner) {
                  bgColor =
                    drawWinner === player.player.player_name
                      ? "bg-green-100"
                      : "bg-red-100";
                } else if (hasValue && !unresolvedDraw) {
                  const mirrorKey = getCellKey(opponentIndex, playerIndex);
                  const data = getMergedCellData(cellKey);
                  const mirrorData = getMergedCellData(mirrorKey);
                  const playerHits =
                    data?.playerHits ?? mirrorData?.opponentHits;
                  const opponentHits =
                    data?.opponentHits ?? mirrorData?.playerHits;
                  if (
                    playerHits !== "" &&
                    playerHits !== undefined &&
                    opponentHits !== "" &&
                    opponentHits !== undefined
                  ) {
                    if (playerHits > opponentHits) bgColor = "bg-green-100";
                    else if (playerHits < opponentHits) bgColor = "bg-red-100";
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
                        if (el) inputRefs.current.set(cellKey, el);
                      }}
                      type="number"
                      min="0"
                      max="99"
                      className={`w-full h-full p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${bgColor}`}
                      value={cellValue}
                      onChange={(e) =>
                        onCellChange(playerIndex, opponentIndex, e.target.value)
                      }
                      onKeyDown={(e) => onKeyDown(e, playerIndex, opponentIndex)}
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
  );
}
