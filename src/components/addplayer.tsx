import { useTournamentContext } from "@/context/TournamentContext";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import Button from "./Button";

type AddplayerProps = {
  closeModal: () => void;
  playerList: string[];
};

const Addplayer = ({ closeModal, playerList }: AddplayerProps) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("AddPlayer");
  const context = useTournamentContext();
  const isRoundRobin = context.tournament?.format === "Round Robin";
  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPlayer = formData.get("name")?.toString().trim();
    const poolIdRaw = formData.get("poolId")?.toString();
    const poolId = isRoundRobin && poolIdRaw ? Number(poolIdRaw) || null : null;

    const newP = {
      name: newPlayer,
      tournamentId: context.tournament?.id,
      poolId,
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
    setLoading(false);
  };

  return (
    <form onSubmit={submitForm} className="space-y-10">
      <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {t("title")}
      </h2>
      <input
        list="playerslist"
        id="name"
        name="name"
        type="text"
        required
        placeholder={t("name")}
        autoFocus
        autoComplete="off"
        className="flex w-full justify-center rounded-md border-0 py-1.5 px-3 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
      />
      <datalist id="playerslist">
        {playerList.map((fetchPlayerNames) => (
          <option key={fetchPlayerNames} value={fetchPlayerNames}>
            {fetchPlayerNames}
          </option>
        ))}
      </datalist>
      {isRoundRobin && context.pools.length > 0 && (
        <select
          name="poolId"
          required
          className="flex w-full justify-center rounded-md border-0 py-1.5 px-3 shadow-xs ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
        >
          {context.pools.map((pool) => (
            <option key={pool.id} value={pool.id}>
              {pool.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
        <Button disabled={loading} type="submit" variant="primary" fullWidth>
          {t("submit")}
        </Button>
        <Button onClick={closeModal} variant="secondary" fullWidth>
          {t("back")}
        </Button>
      </div>
    </form>
  );
};

export default Addplayer;
