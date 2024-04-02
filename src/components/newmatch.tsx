"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { useTournamentContext } from "@/context/TournamentContext";
import { Matches } from "@/types/Kysely";

type AddmatchProps = {
  closeModal: () => void;
};

const AddMatch = ({ closeModal }: AddmatchProps) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("NewMatch");
  const context = useTournamentContext();
  const [selectedRound, setSelectedRound] = useState("1");

  const onRoundChange = (e: FormEvent<HTMLInputElement>) => {
    setSelectedRound(e.currentTarget.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!context.tournament) {
      alert(t("notournamentfound"));
      setLoading(false);
      return;
    }

    const form: Matches = {
      match: 1,
      player1: formData.get("player1") as string,
      player1_hits: Number(formData.get("points1")),
      player2: formData.get("player2") as string,
      player2_hits: Number(formData.get("points2")),
      winner: null,
      tournament_id: Number(context.tournament.id),
      round: Number(formData.get("round")),
    };

    if (!form.player1 || !form.player2) {
      alert(t("selectbothplayers"));
      setLoading(false);
      return;
    }

    if (form.player1 === form.player2) {
      alert(t("duplicateplayers"));
      setLoading(false);
      return;
    }

    // check winner
    if (form.player1_hits > form.player2_hits) {
      form.winner = form.player1;
    } else if (form.player2_hits > form.player1_hits) {
      form.winner = form.player2;
    }

    const res = await fetch("/api/match", {
      method: "POST",
      body: JSON.stringify(form),
    });

    console.log(form.player1, form.player2);

    if (!res.ok) {
      setLoading(false);

      switch (res.status) {
        case 400:
          return alert(t("addmatchfailed"));

        case 409:
          return alert(
            `${t("matchexists1")} (${form.player1} & ${form.player2}) ${t(
              "matchexists2"
            )} (${form.round})`
          );

        default:
          return alert(t("unexpectederror"));
      }
    }

    // Update player objects inside context state
    const match: Matches = await res.json();
    context.setPlayers((prevPlayers) => {
      // Find the player with the specific player name
      return prevPlayers.map((player) => {
        // Create a copy of the player and add the match to its matches array
        return {
          player: player.player,
          matches: [...player.matches, match],
        };
      });
    });

    closeModal();
    setLoading(false);
  };

  if (context.players.length === 0) {
    return (
      <>
        <h1 className="mb-10 text-center text-2xl font-semibold leading-9 tracking-tight text-gray-900">
          {t("noplayers")}
        </h1>
        <button
          onClick={closeModal}
          className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-sm"
        >
          {t("back")}
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {t("title")}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex justify-center items-center *:grow">
          <label className="flex gap-1 sm:gap-2 items-center">
            {t("player1")}
            <select
              className="border border-gray-600 rounded-md p-1"
              name="player1"
              defaultValue={"default"}
            >
              <option disabled value="default">
                {t("player1")}
              </option>
              {context.players.map((player) => (
                <option
                  key={player.player.player_name}
                  value={player.player.player_name}
                >
                  {player.player.player_name}
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
              defaultValue={"default"}
            >
              <option disabled value="default">
                {t("player2")}
              </option>
              {context.players.map((player) => (
                <option
                  key={player.player.player_name}
                  value={player.player.player_name}
                >
                  {player.player.player_name}
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
        <div className="flex gap-3">
          <input
            type="radio"
            name="round"
            value="1"
            id="1"
            checked={selectedRound === "1"}
            onChange={onRoundChange}
          />
          <label htmlFor="1">1. {t("title")}</label>
          <input
            type="radio"
            name="round"
            value="2"
            id="2"
            checked={selectedRound === "2"}
            onChange={onRoundChange}
          />
          <label htmlFor="2">2. {t("title")}</label>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <button
            disabled={loading}
            type="submit"
            className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
          >
            {t("submit")}
          </button>
          <button
            type="button"
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
