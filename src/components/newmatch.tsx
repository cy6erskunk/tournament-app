import { useTranslations } from "next-intl";

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

// todo: fix warning message when clicking 'Takaisin'
// message: Form submission canceled because the form is not connected
const AddMatch = ({ closeModal }: AddmatchProps) => {
  const t = useTranslations("NewMatch");
  const createMatch = (formData: FormData) => {
    const matchFormdata = {
      player1: formData.get("player1"),
      player1Points: formData.get("points1"),
      player2: formData.get("player2"),
      player2Points: formData.get("points2"),
    };
    console.log(matchFormdata);
  };
  return (
    <>
      <h1 className="mb-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {t("title")}
      </h1>
      <form action={createMatch} className="flex flex-col gap-6">
        <div className="flex justify-center items-center *:grow">
          <label className="flex gap-1 sm:gap-2 items-center">
            {t("player1")}
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
          <label htmlFor="points1">{t("points")}</label>
          <input
            className="border border-gray-600 rounded-md text-center p-1"
            id="points1"
            type="number"
            min="0"
            max="5"
            name="points1"
            defaultValue={0}
            required
          />
        </div>
        <div className="flex justify-center items-center *:grow">
          <label className="flex gap-1 sm:gap-2 items-center">
            {t("player2")}
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
          <label htmlFor="points2">{t("points")}</label>
          <input
            className="border border-gray-600 rounded-md text-center p-1"
            id="points2"
            type="number"
            min="0"
            max="5"
            name="points2"
            defaultValue={0}
            required
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <button
            type="submit"
            className="bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
          >
            {t("submit")}
          </button>
          <button
            onClick={closeModal}
            className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-sm"
          >
            {t("back")}
          </button>
        </div>
      </form>
    </>
  );
};

export default AddMatch;
