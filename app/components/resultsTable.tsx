"use client";
import { useState } from "react";

const ResultsTable = () => {
  // test data can be removed
  const [players, setPlayers] = useState(["nimi1", "nimi2", "nimi3"]);

  // test function can be removed
  const addPlayer = () => {
    const rNumber = Math.floor(Math.random() * 1000);
    const newPlayer = "player" + rNumber;
    setPlayers((players) => [...players, newPlayer]);
  };

  return (
    <div>
      <button
        onClick={addPlayer}
        className="border border-black rounded-lg px-4 py-2 mb-2 hover:bg-slate-100"
      >
        testi
      </button>
      <div className="overflow-auto max-h-[500px] border-2 border-slate-500">
        <table className="table-auto w-full">
          <thead>
            <tr className="text-white *:py-4 *:sticky *:top-0 *:bg-blue-500 z-10">
              <th>Nimi</th>
              <th title="Id">#</th>
              {/* map through players and set <th>{player id}</th> */}
              {players.map((round, index) => (
                <th key={index}>{index + 1}</th>
              ))}
              <th
                title="Voittoprosentti"
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                V%
              </th>
              <th
                title="Annetut osumat"
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                AO
              </th>
              <th
                title="Vastaanotetut osumat"
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                VO
              </th>
              <th
                title="AO - VO"
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                I
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, i) => (
              <tr
                key={player}
                className="*:ring-1 *:p-4 *:text-center *:ring-slate-500 odd:bg-white even:bg-blue-50"
              >
                <td className="font-semibold">{player}</td>
                <td className="bg-blue-500 text-white">{i + 1}</td>
                {/* round results here. Now hard coded 'V' */}
                {/* set darker bg color if player index same because can't play versus itself */}
                {players.map((round, index) => (
                  <td
                    key={index}
                    className={`${index === i ? "bg-gray-600" : null}`}
                  >
                    {index !== i ? "V" : null}
                  </td>
                ))}
                {/* map through stats when using real data. Now hard coded */}
                <td className="bg-blue-100">33</td>
                <td className="bg-blue-100">8</td>
                <td className="bg-blue-100">13</td>
                <td className="bg-blue-100">-5</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
