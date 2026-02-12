"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { useTournamentContext } from "@/context/TournamentContext";
import { MatchForm, MatchFormSubmit, MatchRow } from "@/types/MatchTypes";
import { Match } from "./Results/Brackets/Tournament";
import { Player } from "@/types/Player";
import Button from "./Button";

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
  const [player1Hits, setPlayer1Hits] = useState(0);
  const [player2Hits, setPlayer2Hits] = useState(0);
  const isPrioRequired = player1Hits === player2Hits;

  const getOpponent = (opp: Player | null) => {
    if (!opp) return null;

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

    const form: MatchForm = {
      match: bracketMatch?.match ?? 1,
      player1: formData.get("player1") as string,
      player1_hits: Number(formData.get("points1")) ?? 0,
      player2: formData.get("player2") as string,
      player2_hits: Number(formData.get("points2")) ?? 0,
      winner: formData.get("winner") as string | null,
      tournament_id: Number(context.tournament.id),
      round: bracketMatch?.round ?? context.activeRound,
    };

    if (!form.player1.trim() || !form.player2.trim()) {
      alert(t("selectbothplayers"));
      setLoading(false);
      return;
    }

    if (form.player1 === form.player2) {
      alert(t("duplicateplayers"));
      setLoading(false);
      return;
    }

    // Check if priority winner is required but not selected
    if (form.player1_hits === form.player2_hits && !form.winner) {
      alert(t("selectwinnerfordraw"));
      setLoading(false);
      return;
    }

    // check winner (if not already set by priority)
    if (form.player1_hits > form.player2_hits) {
      form.winner = form.player1;
    } else if (form.player2_hits > form.player1_hits) {
      form.winner = form.player2;
    }

    // NOTE: find match players
    // for example if input has 'test' and tournament has 'TEST' it's the same player
    if ((!player || !opponent) && !bracketMatch) {
      const findPlayers: Player[] = context.players.filter(
        (player) =>
          (player &&
            player.player.player_name.toLowerCase() ===
            form.player1.toLowerCase()) ||
          (player &&
            player.player.player_name.toLowerCase() ===
            form.player2.toLowerCase()),
      ) as NonNullable<Player>[];

      if (findPlayers.length !== 2) {
        alert(t("selectbothplayers"));
        setLoading(false);
        return;
      }

      if (
        form.player1.toLowerCase() ===
        findPlayers[0].player.player_name.toLowerCase()
      ) {
        form.player1 = findPlayers[0].player.player_name;
        form.player2 = findPlayers[1].player.player_name;
      } else {
        form.player1 = findPlayers[1].player.player_name;
        form.player2 = findPlayers[0].player.player_name;
      }

      form.winner =
        form.player1.toLowerCase() === form.winner?.toLowerCase()
          ? form.player1
          : form.player2;
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
    const match: MatchRow = await res.json();
    context.setPlayers((prevPlayers) => {
      // Find the player with the specific player name
      return prevPlayers.map((player) => {
        if (!player) return player;
        // Check if the player is in the match
        if (
          player &&
          player.player.player_name !== form.player1 &&
          player.player.player_name !== form.player2
        ) {
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
        <Button onClick={closeModal} variant="secondary" fullWidth>
          {t("back")}
        </Button>
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
                className="w-full rounded-md shadow-xs border border-slate-300 px-3 py-1"
                type="text"
                name="player1"
                id="player1"
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
                max="99"
                name="points1"
                placeholder="0"
                autoFocus
                onChange={(e) => setPlayer1Hits(Number(e.target.value))}
              />
            </div>
            <div
              className={
                "flex flex-col gap-3" + (isPrioRequired ? "" : " opacity-0")
              }
            >
              <label htmlFor="winner">{"P"}</label>
              <input
                type="radio"
                name="winner"
                value={bracketMatch?.player1?.player.player_name}
                className="my-2"
                disabled={!isPrioRequired}
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
                className="w-full rounded-md shadow-xs border border-slate-300 px-3 py-1"
                type="text"
                name="player2"
                id="player2"
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
                max="99"
                name="points2"
                placeholder="0"
                onChange={(e) => setPlayer2Hits(Number(e.target.value))}
              />
            </div>
            <div
              className={
                "flex flex-col gap-3" + (isPrioRequired ? "" : " opacity-0")
              }
            >
              <label htmlFor="winner">{"P"}</label>
              <input
                type="radio"
                name="winner"
                value={bracketMatch?.player2?.player.player_name}
                className="my-2"
                disabled={!isPrioRequired}
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <Button disabled={loading} type="submit" variant="primary" fullWidth>
              {t("submit")}
            </Button>
            <Button onClick={closeModal} variant="secondary" fullWidth>
              {t("back")}
            </Button>
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
            <label className="flex flex-col items-center gap-3" htmlFor="player1">
              {t("player1")}
              {player ? (
                <input
                  type="text"
                  name="player1"
                  id="player1"
                  className="w-full rounded-md shadow-xs border border-slate-300 px-3 py-1"
                  defaultValue={player.player.player_name}
                  readOnly
                  required
                />
              ) : (
                <>
                  <input
                    list="player1list"
                    id="player1"
                    name="player1"
                    className="w-full border border-gray-600 rounded-md py-1 px-2"
                    required
                    autoComplete="off"
                    autoFocus
                  />
                  <datalist id="player1list">
                    {context.players.map((player) =>
                      player ? (
                        <option
                          key={player.player.player_name}
                          value={player.player.player_name}
                        >
                          {player.player.player_name}
                        </option>
                      ) : null,
                    )}
                  </datalist>
                </>
              )}
            </label>
          </div>
          <div className="w-1/2 flex flex-col gap-3">
            <label htmlFor="points1">{t("points")}</label>
            <input
              className="w-full border border-gray-600 rounded-md text-center p-1"
              id="points1"
              type="number"
              min="0"
              max="99"
              name="points1"
              placeholder="0"
              autoFocus={player !== undefined}
              onChange={(e) => setPlayer1Hits(Number(e.target.value))}
            />
          </div>
          <div
            className={
              "flex flex-col gap-3" + (isPrioRequired ? "" : " opacity-0")
            }
          >
            <label htmlFor="winner">{"P"}</label>
            <input
              type="radio"
              name="winner"
              value={player?.player.player_name}
              className="my-2"
              disabled={!isPrioRequired}
            />
          </div>
        </div>
        <div className="flex gap-6 *:grow">
          <div className="w-1/2">
            <label className="flex flex-col items-center gap-3" htmlFor="player2">
              {t("player2")}
              {opponent ? (
                <input
                  type="text"
                  name="player2"
                  id="player2"
                  className="w-full rounded-md shadow-xs border border-slate-300 px-3 py-1"
                  defaultValue={opponent.player.player_name}
                  readOnly
                  required
                />
              ) : (
                <>
                  <input
                    list="player2list"
                    id="player2"
                    name="player2"
                    className="w-full border border-gray-600 rounded-md py-1 px-2"
                    required
                    autoComplete="off"
                  />
                  <datalist id="player2list">
                    {context.players.map((player) => getOpponent(player))}
                  </datalist>
                </>
              )}
            </label>
          </div>
          <div className="w-1/2 flex flex-col gap-3">
            <label htmlFor="points2">{t("points")}</label>
            <input
              className="w-full border border-gray-600 rounded-md text-center p-1"
              id="points2"
              type="number"
              min="0"
              max="99"
              name="points2"
              placeholder="0"
              onChange={(e) => setPlayer2Hits(Number(e.target.value))}
            />
          </div>
          <div
            className={
              "flex flex-col gap-3" + (isPrioRequired ? "" : " opacity-0")
            }
          >
            <label htmlFor="winner">{"P"}</label>
            <input
              type="radio"
              name="winner"
              value={opponent?.player.player_name}
              className="my-2"
              disabled={!isPrioRequired}
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
          <Button disabled={loading} type="submit" variant="primary" fullWidth>
            {t("submit")}
          </Button>
          <Button onClick={closeModal} variant="secondary" fullWidth>
            {t("back")}
          </Button>
        </div>
      </form>
    </>
  );
};

export default AddMatch;
