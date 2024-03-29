import { useTournamentContext } from "@/context/TournamentContext";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

type AddplayerProps = {
  closeModal: () => void;
};

const Addplayer = ({ closeModal }: AddplayerProps) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("AddPlayer");
  const context = useTournamentContext();

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPlayer = formData.get("name");

    const res = await fetch("/api/addplayer", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert(t("erroraddingplayer"));
      console.log(res);
      setLoading(false);
      return;
    }

    const player = await res.json();
    context.setPlayers((players) => [...players, player]);

    closeModal();
    alert(`${newPlayer} ${t("playeradded")}`);
    setLoading(false);
  };

  return (
    <form onSubmit={submitForm} className="space-y-10">
      <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {t("title")}
      </h2>
      <input
        id="name"
        name="name"
        type="text"
        required
        placeholder={t("name")}
        className="flex w-full justify-center rounded-md border-0 py-1.5 px-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
      />
      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
        <button
          disabled={loading}
          type="submit"
          className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
        >
          {t("submit")}
        </button>
        <button
          onClick={closeModal}
          className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-sm"
          type="button"
        >
          {t("back")}
        </button>
      </div>
    </form>
  );
};

export default Addplayer;
