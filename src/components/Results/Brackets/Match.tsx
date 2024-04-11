import { Player } from "@/types/Player";
import { Match } from "./Tournament";

type MatchProps = {
  competitors: (Player | undefined)[];
  match: Match;
};

export default function Match({ competitors, match }: MatchProps) {
  const getMatch = (competitor: Player | undefined) => {
    if (!competitor) {
      return (
        <li
          key={`${match.match}-${match.round}`}
          className="flex items-center px-4 py-2 leading-relaxed text-white rounded-md relative w-full bg-gray-800"
        >
          <span>
            ...
          </span>
        </li>
      )
    }
    const playerKey =
      match.player1?.player.player_name === competitor.player.player_name
        ? "player1"
        : "player2";
    return (
      <li
        key={`${competitor.player.player_name}-${match.match}-${match.round}`}
        className={`flex items-center px-4 py-2 leading-relaxed text-white rounded-md relative w-full ${match.winner === competitor.player.player_name
          ? "bg-green-500"
          : "bg-gray-800"
          }`}
      >
        <div className="flex gap-4 text-gray-200 text-xs items-center">
          <span>
            Hits: {match[`${playerKey}_hits`]}
          </span>
          <span className="text-white text-base">
            {competitor.player.player_name}
          </span>
          <span>
            Match: {match.match}
          </span>
          <span>
            Round: {match.round}
          </span>
        </div>
      </li>
    );
  };

  if (!competitors.length) return;

  return (
    <div className="flex justify-center items-center gap-2">
      <span className="text-slate-400">{match.round}</span>
      <div className="flex flex-1 flex-col gap-4 justify-center items-center">
        {competitors.map((competitor) => {
          return getMatch(competitor);
        })}
      </div>
    </div>
  );
}
