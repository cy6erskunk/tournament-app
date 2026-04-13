import type { Player } from "@/types/Player";

export interface CellData {
  playerHits: number | "";
  opponentHits: number | "";
  winner: string | null;
}

export interface DrawMatch {
  playerIndex: number;
  opponentIndex: number;
  player1Name: string;
  player2Name: string;
  hits: number;
}

export interface PlayerWithIndex {
  player: Player;
  globalIndex: number;
}
