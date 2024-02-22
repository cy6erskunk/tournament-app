import { TrophyIcon } from "@heroicons/react/24/solid";

// todo: delete this when using real data
const mockPlayers = [
  "Pelaaja 2",
  "Pelaaja 4",
  "Pelaaja 1",
  "Pelaaja 3",
  "Pelaaja 9",
  "Pelaaja 11",
  "Pelaaja 12",
  "Pelaaja 8",
  "Pelaaja 7",
  "Pelaaja 6",
];

const LeaderboardHome = () => {
  const getRowBgColor = (index: number) => {
    if (index === 0) return "bg-gradient-to-r from-yellow-50 to-yellow-200";
    if (index === 1) return "bg-gradient-to-r from-gray-50 to-gray-300";
    if (index === 2) return "bg-gradient-to-r from-amber-50 to-amber-300";
    return "odd:bg-white even:bg-gray-50";
  };
  return (
    <div className="overflow-hidden border-2 rounded-md shadow-md border-gray-400">
      <table className="table-auto w-full">
        <thead>
          <tr className="text-white *:py-4 bg-gray-400">
            <th>SIJA</th>
            <th>NIMI</th>
          </tr>
        </thead>
        <tbody>
          {mockPlayers.map((player, index) => (
            <tr
              key={index}
              // uncomment to get row bg colors without linear gradients
              // className="*:text-center *:py-4 odd:bg-white even:bg-gray-100"
              className={`*:text-center *:py-4 ${getRowBgColor(index)}`}
            >
              <td className="relative">
                <p>{index + 1}</p>
                {/* trophy icons to top 3 */}
                {index < 3 && (
                  <div className="absolute inset-y-0 left-6 flex items-center justify-center w-full">
                    <TrophyIcon
                      className={`w-6 h-6 ${
                        index === 0
                          ? "text-yellow-400"
                          : index === 1
                          ? "text-gray-700"
                          : "text-amber-950"
                      }`}
                    />
                  </div>
                )}
              </td>
              <td>{player}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardHome;
