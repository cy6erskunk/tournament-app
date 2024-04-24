import { Player } from "@/types/Player"

export function hitIndex(player: Player) {
  return player.matches.reduce((count, match) => {
    const playerKey = match.player1 === player.player.player_name ? "player1" : "player2"
    const opponentKey = match.player1 === player.player.player_name ? "player2" : "player1"
    const playerHits = match[`${playerKey}_hits`];
    const opponentHits = match[`${opponentKey}_hits`];
    const index = playerHits - opponentHits;
    return count += index;
  }, 0);
}
