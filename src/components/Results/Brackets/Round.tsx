import Match from "./Match";
import { Round } from "./Tournament";

export default function Round({ round }: { round: Round }) {
  const matches = round.matches.map((match) => (
    <Match
      key={`${match.round}-${match.match}`}
      competitors={[match.player1, match.player2]}
      match={match}
    />
  ));

  return (
    <div className="grid w-full auto-cols-fr auto-rows-fr gap-32">
      {matches}
    </div>
  );
}
