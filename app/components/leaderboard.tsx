const Leaderboard = () => {
  return (
    <div className="">
      <h1 className="py-3">Leaderboard</h1>
      <div className="overflow-auto max-h-[500px] border-2 rounded-md shadow-md border-slate-500 text-xs md:text-base">
        <table className="w-full">
          <thead>
            <tr className="text-white *:py-2 *:md:py-4 *:bg-slate-500 *:w-20">
              <th>Nimi</th>
              <th
                title="Voitot"
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                V
              </th>
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
              <th
                title="Sijoitus"
                className="underline decoration-dotted cursor-help underline-offset-2"
              >
                Sija
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Hard data until logic implemented */}
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player1</td>
              <td>1</td>
              <td>100%</td>
              <td>10</td>
              <td>0</td>
              <td>10</td>
              <td>1</td>
            </tr>
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player2</td>
              <td>0</td>
              <td>0%</td>
              <td>0</td>
              <td>10</td>
              <td>-10</td>
              <td>2</td>
            </tr>
            <tr className="*:ring-1 *:py-2 *:md:p-4 *:text-center *:ring-slate-500">
              <td>player3</td>
              <td>0</td>
              <td>0%</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>3</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
