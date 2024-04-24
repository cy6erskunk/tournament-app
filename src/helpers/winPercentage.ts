import { Player } from "@/types/Player";

function winPercentage(player: Player) {
  const w = wins(player);
  const m = player.matches.length;
  // Prevent division by zero
  // Either results in NaN or Infinity
  if (w === 0 || m === 0) return 0

  return (wins(player) / player.matches.length) * 100;
}

function wins(player: Player) {
  const wins = player.matches.filter(
    (match) => match.winner === player.player.player_name,
  ).length;

  return wins;
}

export default winPercentage;
export { wins };
