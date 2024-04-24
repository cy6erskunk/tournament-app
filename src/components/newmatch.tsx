"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { useTournamentContext } from "@/context/TournamentContext";
import { Matches } from "@/types/Kysely";
import NormalizedId from "@/types/NormalizedId";
import { Match } from "./Results/Brackets/Tournament";
import { Player } from "@/types/Player";

type AddmatchProps = {
  closeModal: () => void;
  bracketMatch?: Match;
  player?: Player;
  opponent?: Player;
};

const AddMatch = ({
  closeModal,
  bracketMatch,
  player,
  opponent,
}: AddmatchProps) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("NewMatch");
  const context = useTournamentContext();

  const getOpponent = (opp: Player) => {
    const playerName = player?.player.player_name;
    const opponentName = opp.player.player_name;

    if (opponentName === playerName) return null;

    // Check if player already played against opponent in current round
    if (player?.matches && player.matches.length > 0) {
      for (const match of player?.matches) {
        if (
          (match.player1 === opponentName &&
            context.activeRound === match.round) ||
          (match.player2 === opponentName &&
            context.activeRound === match.round)
        ) {
          return null;
        }
      }
    }

    return (
      <option key={opp.player.player_name} value={opp.player.player_name}>
        {opp.player.player_name}
      </option>
    );
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

    const form: Omit<Matches, "id"> = {
      match: bracketMatch?.match ?? 1,
      player1: formData.get("player1") as string,
      player1_hits: Number(formData.get("points1")),
      player2: formData.get("player2") as string,
      player2_hits: Number(formData.get("points2")),
      winner: null,
      tournament_id: Number(context.tournament.id),
      round: bracketMatch?.round ?? context.activeRound,
    };

    if (form.player1_hits === form.player2_hits) {
      alert(t("nodraws"));
      setLoading(false);
      return;
    }

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

    const res = await fetch("/api/matches", {
      method: "POST",
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      setLoading(false);

      switch (res.status) {
        case 400:
          return alert(t("addmatchfailed"));

        case 409:
          return alert(
            `${t("matchexists1")} (${form.player1} & ${form.player2}) ${t(
              "matchexists2",
            )} (${form.round})`,
          );

        default:
          return alert(t("unexpectederror"));
      }
    }

    // Update player objects inside context state
    const match: NormalizedId<Matches> = await res.json();
    context.setPlayers((prevPlayers) => {
      // Find the player with the specific player name
      return prevPlayers.map((player) => {
        // Check if the player is in the match
        if (player.player.player_name !== form.player1 && player.player.player_name !== form.player2) {
          return player;
        }

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

  if (context.tournament?.format === "Brackets") {
    return (
      <>
        <h1 className="mb-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {`${bracketMatch?.round}. ${t("title")}`}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex *:grow gap-3">
            <div className="w-1/2 flex flex-col gap-3">
              <label
                htmlFor="player1"
                className="flex gap-1 sm:gap-2 items-center"
              >
                {t("player1")}
              </label>
              <input
                className="w-full rounded-md shadow-sm border border-slate-300 px-3 py-1"
                type="text"
                name="player1"
                defaultValue={bracketMatch?.player1?.player.player_name}
                readOnly
                required
              />
            </div>
            <div className="w-1/2 flex flex-col gap-3">
              <label htmlFor="points1">{t("points")}</label>
              <input
                className="w-full border border-gray-600 rounded-md text-center p-1"
                id="points1"
                type="number"
                min="0"
                max="5"
                name="points1"
                placeholder="0"
                required
              />
            </div>
          </div>
          <div className="flex *:grow gap-3">
            <div className="w-1/2 flex flex-col gap-3">
              <label
                htmlFor="player2"
                className="flex gap-1 sm:gap-2 items-center"
              >
                {t("player2")}
              </label>
              <input
                className="w-full rounded-md shadow-sm border border-slate-300 px-3 py-1"
                type="text"
                name="player2"
                defaultValue={bracketMatch?.player2?.player.player_name}
                readOnly
                required
              />
            </div>
            <div className="w-1/2 flex flex-col gap-3">
              <label htmlFor="points2">{t("points")}</label>
              <input
                className="w-full border border-gray-600 rounded-md text-center p-1"
                id="points2"
                type="number"
                min="0"
                max="5"
                name="points2"
                placeholder="0"
                required
              />
            </div>
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
  }

  return (
    <>
      <h1 className="mb-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {`${context.activeRound}. ${t("title")}`}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex gap-6 *:grow">
          <div className="w-1/2">
            <label className="flex flex-col items-center">
              {t("player1")}
              {player ? (
                <input
                  className="w-full rounded-md shadow-sm border border-slate-300 px-3 py-1"
                  type="text"
                  name="player1"
                  defaultValue={player.player.player_name}
                  readOnly
                  required
                />
              ) : (
                <select
                  className="w-full border border-gray-600 rounded-md p-1"
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
              )}
            </label>
          </div>
          <div className="w-1/2">
            <label htmlFor="points1">{t("points")}</label>
            <input
              className="w-full border border-gray-600 rounded-md text-center p-1"
              id="points1"
              type="number"
              min="0"
              max="5"
              name="points1"
              placeholder="0"
              required
            />
          </div>
        </div>
        <div className="flex gap-6 *:grow">
          <div className="w-1/2">
            <label className="flex flex-col items-center">
              {t("player2")}
              {opponent ? (
                <input
                  className="w-full rounded-md shadow-sm border border-slate-300 px-3 py-1"
                  type="text"
                  name="player2"
                  defaultValue={opponent.player.player_name}
                  readOnly
                  required
                />
              ) : (
                <select
                  className="w-full border border-gray-600 rounded-md p-1"
                  name="player2"
                  defaultValue={"default"}
                >
                  <option disabled value="default">
                    {t("player2")}
                  </option>
                  {context.players.map((player) => getOpponent(player))}
                </select>
              )}
            </label>
          </div>
          <div className="w-1/2">
            <label htmlFor="points2">{t("points")}</label>
            <input
              className="w-full border border-gray-600 rounded-md text-center p-1"
              id="points2"
              type="number"
              min="0"
              max="5"
              name="points2"
              placeholder="0"
              required
            />
          </div>
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
