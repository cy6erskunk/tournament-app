import type { Player } from "@/types/Player";
import type { Match as TMatch, Round } from "./Tournament";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import { useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";

type MatchProps = {
  competitors: (Player | null)[];
  match: TMatch;
  round: Round;
};

export default function Match({ competitors, match, round }: MatchProps) {
  const [showModal, setShowModal] = useState(false);
  const t = useTranslations("NewMatch");

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const getMatch = (competitor: Player | null, index: number) => {
    if (!competitor) {
      // Create empty competitor object
      competitor = {
        player: {
          player_name: "",
          tournament_id: 0,
          bracket_match: null,
          bracket_seed: null,
          pool_id: null,
        },
        matches: [],
      };
    }
    const playerKey =
      match.player1?.player.player_name === competitor.player.player_name
        ? "player1"
        : "player2";

    const isWinner = match.winner === competitor.player.player_name;
    const isLoser =
      match.winner && match.winner !== competitor.player.player_name;
    const isWinnerByBye =
      match.round === 1 &&
      (match.player1 === null || match.player2 === null) &&
      competitor.player.player_name;

    return (
      <div
        key={`${index}-${match.match}-${round.id}`}
        className={`flex items-center px-1 py-1 leading-relaxed relative w-full border-2 border-slate-500 rounded-md shadow-md ${isWinner || isWinnerByBye
          ? "bg-green-500"
          : "bg-white *:text-gray-800"
          }`}
      >
        <div className="flex gap-4 items-center w-full p-2">
          <div className="flex w-10 aspect-square rounded-md items-center bg-slate-200">
            <span className="text-center w-full font-mono">
              {" "}
              {match[`${playerKey}_hits`]}
            </span>
          </div>

          <div className="flex justify-between w-full">
            <div className="flex gap-4">
              <span
                className={`text-xl font-bold ${isLoser ? "line-through" : ""}`}
              >
                {competitor.player.player_name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm *:text-nowrap">
              <span>{`${t("match")}: ${match.match}`}</span>
              <span>{`${t("title")}: ${match.round}`}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!competitors.length) return;

  const notPlayed = !match.winner && match.player1 && match.player2;

  return (
    <div className="flex justify-center items-center gap-2">
      <span className="text-slate-400 py-8">{match.round}</span>
      <div className="overflow-auto w-full flex gap-2 flex-col">
        {competitors.map((player, index) => getMatch(player, index))}
      </div>

      {notPlayed ? (
        <>
          <button type="button" aria-label={t("match")} onClick={() => openModal()}>
            <PlusCircleIcon className="h-8 w-8 hover:text-blue-600" />
          </button>
          <Modal isOpen={showModal} closeModal={closeModal}>
            <AddMatch closeModal={closeModal} bracketMatch={match} />
          </Modal>
        </>
      ) : null}
    </div>
  );
}
