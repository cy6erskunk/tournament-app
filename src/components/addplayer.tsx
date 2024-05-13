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
    const newPlayer = formData.get("name")?.toString().trim();

    const newP = {
      name: newPlayer,
      tournamentId: context.tournament?.id,
    };

    // check if name is empty
    if (!newP.name) {
      alert(t("emptyname"));
      setLoading(false);
      return;
    }

    // check name length
    if (newP.name.length > 16) {
      alert(t("nametoolong"));
      setLoading(false);
      return;
    }

    // check if player is already in the tournament
    const isAlreadyInTournament = context.players.filter(
      (player) =>
        player &&
        player.player.player_name.toLowerCase() === newP.name?.toLowerCase(),
    );
    if (isAlreadyInTournament.length) {
      alert(t("alreadyintournament"));
      setLoading(false);
      return;
    }

    const res = await fetch("/api/addplayer", {
      method: "POST",
      body: JSON.stringify(newP),
    });

    if (!res.ok) {
      const errorMessage = await res.text();
      switch (res.status) {
        case 400:
          if (
            errorMessage === "Error adding player to tournament_players table"
          ) {
            alert(t("playernotfound", { title2: t("title2") }));
            break;
          }
          alert(t("erroraddingplayer"));
          break;
        case 401:
          alert(t("unauth"));
          break;
        default:
          alert(t("erroraddingplayer"));
      }
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
        autoFocus
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
