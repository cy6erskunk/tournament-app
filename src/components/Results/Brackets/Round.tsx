import Match from "./Match";
import { Round } from "./Tournament";

type RoundProps = {
  round: Round;
};

export default function Round({ round }: RoundProps) {
  const players = round.matches.map((match) => {
    return [match.player1, match.player2]
  })

  const matches = round.matches.map((match) => (
    <Match
      key={`round-${round.id}-match-${match.match}`}
      competitors={[match.player1, match.player2]}
      match={match}
      round={round}
    />
  ));

  return (
    <div className="grid w-full auto-rows-fr gap-32 min-w-[450px]">
      {matches}
    </div>
  );
}
