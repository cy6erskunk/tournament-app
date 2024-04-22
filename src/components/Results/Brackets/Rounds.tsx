import Round from "./Round";
import type { Round as RoundT } from "./Tournament"

const Rounds = ({ tournament }: { tournament: RoundT[] }) => {
  return tournament.map((round) => (
    <div key={`round-${round.id}`} className="flex first:ml-auto last:mr-auto">
      {/* NOTE: please dont remove first: and last: classes or brackets will break on mobile */}
      <Round round={round} />
    </div>
  ));
};

export default Rounds;
