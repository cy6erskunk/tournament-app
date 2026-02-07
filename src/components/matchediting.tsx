"use client";

import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import {
  TournamentContext,
  useTournamentContext,
} from "@/context/TournamentContext";
import {
  MatchForm,
  MatchFormSubmit,
  MatchRow,
  NewMatch,
} from "@/types/MatchTypes";
import { Player } from "@/types/Player";

function findSharedMatch(
  player: Player,
  opponent: Player,
  context: TournamentContext
) {
  // If players share a match, add it to the round
  const matchIds = player.matches.map((match) => match.id);
  const match = opponent.matches.find(
    (match) =>
      matchIds.includes(match.id) && match.round === context.activeRound
  );

  if (!match) return match;

  // We need to flip the players
  if (match.player1 === opponent.player.player_name) {
    match.player1 = player.player.player_name;
    match.player2 = opponent.player.player_name;

    // Swap match.player1_hits and match.player2_hits in place
    const temp = match.player1_hits;
    match.player1_hits = match.player2_hits;
    match.player2_hits = temp;
  }

  return match;
}

type EditmatchProps = {
  closeModal: () => void;
  player: Player;
  opponent: Player;
};

const EditMatch = ({ closeModal, player, opponent }: EditmatchProps) => {
  const [loading, setLoading] = useState(false);
  const t = useTranslations("NewMatch");
  const context = useTournamentContext();
  const [player1Hits, setPlayer1Hits] = useState(
    findSharedMatch(player, opponent, context)?.player1_hits ?? 0
  );
  const [player2Hits, setPlayer2Hits] = useState(
    findSharedMatch(player, opponent, context)?.player2_hits ?? 0
  );
  const isPrioRequired = player1Hits === player2Hits;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!context.tournament) {
      alert(t("notournamentfound"));
      setLoading(false);
      return;
    }

    // Get which button was clicked from the submitter element
    // This works reliably in both production and tests
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    const buttonValue = submitter?.value || "";

    const form: MatchForm = {
      match: 1,
      player1: formData.get("player1") as string,
      player1_hits: Number(formData.get("points1")),
      player2: formData.get("player2") as string,
      player2_hits: Number(formData.get("points2")),
      winner: formData.get("winner") as string | null,
      tournament_id: Number(context.tournament.id),
      round: context.activeRound,
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

    if (buttonValue === "Update") {
      if (form.player1_hits === form.player2_hits && !form.winner) {
        alert(t("selectwinnerfordraw"));
      } else {
        // check winner
        if (form.player1_hits > form.player2_hits) {
          form.winner = form.player1;
        } else if (form.player2_hits > form.player1_hits) {
          form.winner = form.player2;
        }

        updateHandler(form as MatchFormSubmit);
        closeModal();
      }
    } else if (buttonValue === "Delete") {
      deleteHandler(form);
      closeModal();
    }

    setLoading(false);
  };

  const updateHandler = async (form: MatchFormSubmit) => {
    /*
    TODO: add validation that formData should always contain winner
    */
    const formData = form as NewMatch;
    const res = await fetch("/api/matches", {
      method: "PUT",
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      setLoading(false);

      switch (res.status) {
        case 400:
          return alert(t("addmatchfailed"));

        case 409:
          return alert(
            `${t("matchexists1")} (${formData.player1} & ${
              formData.player2
            }) ${t("matchexists2")} (${formData.round})`
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
          player.player.player_name !== formData.player1 &&
          player.player.player_name !== formData.player2
        ) {
          return player;
        }

        // Update match data
        const matches = player.matches.map((playerMatch) => {
          if (playerMatch.id !== match.id) return playerMatch;

          // Check if we need to swap player1 and player2
          // ...as they are not always consistent
          let p1 = form["player1_hits"];
          let p2 = form["player2_hits"];
          if (playerMatch.player1 !== form["player1"]) {
            p1 = form["player2_hits"];
            p2 = form["player1_hits"];
          }

          playerMatch.player1_hits = p1;
          playerMatch.player2_hits = p2;
          playerMatch.winner = formData.winner;

          return playerMatch;
        });

        return {
          player: player.player,
          matches,
        };
      });
    });
    alert(t("matchupdated"));
  };

  const deleteHandler = async (form: MatchForm) => {
    const res = await fetch("/api/matches", {
      method: "DELETE",
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
              "matchexists2"
            )} (${form.round})`
          );

        default:
          return alert(t("unexpectederror"));
      }
    }

    // Update player objects inside context state
    const filter = (prevPlayers: (Player | null)[]): (Player | null)[] => {
      // Find the player with the specific player name
      return prevPlayers.map((player) => {
        if (!player) return player;
        // Check if the player is in the match
        if (
          player.player.player_name !== form.player1 &&
          player.player.player_name !== form.player2
        ) {
          return player;
        }

        const matches = player.matches.filter((m) => {
          const p1 = m.player1 === form.player1 ? "player1" : "player2";
          const p2 = m.player1 === form.player1 ? "player2" : "player1";

          if (m.player1 !== form[p1]) return true;
          if (m.player2 !== form[p2]) return true;
          if (m.round !== form.round) return true;
          return false;
        });

        return {
          player: player.player,
          matches,
        };
      });
    };
    context.setPlayers(filter);

    alert(t("matchdeleted"));
  };

  return (
    <>
      <h1 className="mb-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        {t("title2")}
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
              defaultValue={player.player.player_name}
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
              defaultValue={
                findSharedMatch(player, opponent, context)?.player1_hits ?? 0
              }
              required
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
              value={player.player.player_name}
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
              defaultValue={opponent.player.player_name}
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
              defaultValue={
                findSharedMatch(player, opponent, context)?.player2_hits ?? 0
              }
              required
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
              value={opponent.player.player_name}
              className="my-2"
              disabled={!isPrioRequired}
            />
          </div>
        </div>
        <div className="flex flex-row items-center justify-center gap-2 text-sm font-semibold">
          <div className="flex flex-col w-full gap-1">
            <button
              disabled={loading}
              type="submit"
              name="buttonClicked"
              value="Update"
              className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t("submit")}
            </button>
            <button
              disabled={loading}
              type="submit"
              name="buttonClicked"
              value="Delete"
              className="disabled:bg-red-300 bg-red-400 py-2 px-3 text-white rounded-md shadow-xs mx-auto w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {t("delete")}
            </button>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            {t("back")}
          </button>
        </div>
      </form>
    </>
  );
};
export default EditMatch;
