import Round from "./Round";
import { Tournament } from "./Tournament";

const Rounds = ({ tournament }: { tournament: Tournament }) => {
  return tournament.rounds.map((round) => (
    <Round key={round.id} round={round} />
  ));
};

export default Rounds;
