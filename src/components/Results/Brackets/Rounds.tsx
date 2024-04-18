import Round from "./Round";
import type { Round as RoundT } from "./Tournament"

const Rounds = ({ tournament }: { tournament: RoundT[] }) => {
  return tournament.map((round) => (
    <Round key={`round-${round.id}`} round={round} />
  ));
};

export default Rounds;
