"use client";

import { useTranslations } from "next-intl";
import { FormEvent } from "react";
import { useTournamentContext } from "@/context/TournamentContext";
import { Matches } from "@/database/types";

type AddmatchProps = {
  closeModal: () => void;
};

const AddMatch = ({ closeModal }: AddmatchProps) => {
  const t = useTranslations("NewMatch");
  const context = useTournamentContext();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const form = {
      player1: formData.get("player1") as string,
      points1: Number(formData.get("points1")),
      player2: formData.get("player2") as string,
      points2: Number(formData.get("points2")),
    };
    if (form.player1 === form.player2) {
      alert("Same players");
      return;
    }
    const requestBody = {
      formData: form,
      round: context.activeRound,
    };

    const res = await fetch("/api/match", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      alert("error");
      return;
    }

    // UPDATE PLAYER OBJECTS INSIDE CONTEXT STATE
    // This works by extracting objects out, modifying them
    // and then pushing back to state
    const match: Matches = await res.json();
    context.setPlayers((prevPlayers) => {
      // Find the player with the specific player name
      const updatedPlayers = prevPlayers.map((player) => {
        // Create a copy of the player and add the match to its matches array
        switch (player.player.player_name) {
          case form.player1:
            player.player.hits_given += form.points1;
            player.player.hits_received += form.points2;
            return {
              player: player.player,
              matches: [...player.matches, match],
            };
          case form.player2:
            player.player.hits_given += form.points2;
            player.player.hits_received += form.points1;
            return {
              player: player.player,
              matches: [...player.matches, match],
            };
          default:
            return player;
        }
      });
      return updatedPlayers;
    });

    console.log(context.players[0].player);

    closeModal();
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
            >
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
            >
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
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <button
            type="submit"
            className="bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
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
