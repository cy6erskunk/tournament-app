import { createMatch } from "../actions";

type AddmatchProps = {
  closeModal: () => void;
};

// todo: delete this when using real data
const mockPlayers = [
  "Pelaaja 2",
  "Pelaaja 4",
  "Pelaaja 1",
  "Pelaaja 3",
  "Pelaaja 9",
];

const AddMatch = ({ closeModal }: AddmatchProps) => {
  const handleSubmit = async (formData: FormData) => {
    await createMatch(formData);
  };

  /** throws this error
   * It is not allowed to define inline "use server"
   * annotated Server Actions in Client Components.
   */
  //   const createMatch = async (formData: FormData) => {
  //     "use server";
  //     const matchFormdata = {
  //       player1: formData.get("player1"),
  //       player1Points: formData.get("points1"),
  //       player2: formData.get("player2"),
  //       player2Points: formData.get("points2"),
  //     };
  //     // use form data here
  //     console.log(matchFormdata);
  //   };
  return (
    <>
      <h1 className="mb-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        1. Kierros
      </h1>
      <form action={handleSubmit}>
        <div className="flex justify-center items-center *:grow mb-4">
          <label className="flex gap-1 sm:gap-2 items-center">
            Ottelija 1
            <select
              className="border border-gray-600 rounded-md p-1"
              name="player1"
            >
              {mockPlayers.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="points1">Pisteet</label>
          <input
            className="border border-gray-600 rounded-md text-center p-1"
            id="points1"
            type="number"
            min="0"
            max="5"
            name="points1"
            defaultValue={0}
          />
        </div>
        <div className="flex justify-center items-center *:grow mb-6">
          <label className="flex gap-1 sm:gap-2 items-center">
            Ottelija 2
            <select
              className="border border-gray-600 rounded-md p-1"
              name="player2"
            >
              {mockPlayers.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="points2">Pisteet</label>
          <input
            className="border border-gray-600 rounded-md text-center p-1"
            id="points2"
            type="number"
            min="0"
            max="5"
            name="points2"
            defaultValue={0}
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <button
            type="submit"
            className="bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
          >
            Tallenna
          </button>
          <button
            onClick={closeModal}
            className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-sm"
          >
            Takaisin
          </button>
        </div>
      </form>
    </>
  );
};

export default AddMatch;
