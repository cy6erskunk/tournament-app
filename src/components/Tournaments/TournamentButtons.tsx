"use client";

import { useState, ReactNode, useEffect } from "react";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import Addplayer from "@/components/addplayer";
import QRMatchModal from "@/components/QRMatchModal";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { getPlayer } from "@/database/getPlayers";

const TournamentButtons = () => {
  const t = useTranslations("Tournament.Buttons");
  const context = useTournamentContext();

  const [playersList, setPlayersList] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [leaderboardText, setLeaderboardText] = useState(t("leaderboard"));

  useEffect(() => {
    async function fetchPlayerNames() {
      const fetchPlayers = await getPlayer();
      if (!fetchPlayers.success) {
        console.log("Error: " + fetchPlayers.error);
        return;
      }
      setPlayersList(fetchPlayers.value);
    }
    fetchPlayerNames();
  }, []);

  const isSeeded = context.players.some(
    (player) => player && player.player.bracket_seed,
  );

  const isRoundRobin = context.tournament?.format === "Round Robin";

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  const toggleLeaderboard = () => {
    context.setHidden(!context.hidden);
    if (leaderboardText === t("leaderboard")) {
      setLeaderboardText(t("back"));
    } else {
      setLeaderboardText(t("leaderboard"));
    }
  };

  if (isSeeded) {
    return null;
  }

  if (context.loading) {
    return (
      <div className="container mx-auto p-2 flex flex-col md:flex-row gap-4">
        <div className="p-1 px-5 border rounded-md shadow-xs border-slate-300 bg-slate-100 text-slate-400 animate-pulse w-24 h-8" />
        <div className="p-1 px-5 border rounded-md shadow-xs border-slate-300 bg-slate-100 text-slate-400 animate-pulse w-36 h-8" />
        <div className="p-1 px-5 border rounded-md shadow-xs border-slate-300 bg-slate-100 text-slate-400 animate-pulse w-24 h-8" />
        <div className="p-1 px-5 border rounded-md shadow-xs border-slate-300 bg-slate-100 text-slate-400 animate-pulse w-28 h-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 flex flex-col md:flex-row gap-4">
      {isRoundRobin && (
        <button
          className="p-1 px-5 border rounded-md shadow-xs border-slate-600"
          onClick={() => openModal(<AddMatch closeModal={closeModal} />)}
        >
          {t("addmatch")}
        </button>
      )}
      <button
        className="p-1 px-5 border rounded-md shadow-xs border-slate-600 bg-green-50 border-green-500 text-green-700"
        onClick={() => openModal(<QRMatchModal closeModal={closeModal} />)}
      >
        Generate QR Match
      </button>
      <button
        className="p-1 px-5 border rounded-md shadow-xs border-slate-600"
        onClick={() =>
          openModal(
            <Addplayer closeModal={closeModal} playerList={playersList} />,
          )
        }
      >
        {t("addplayer")}
      </button>
      <button
        className={`p-1 px-5 border rounded-md shadow-xs border-slate-600 text-center ${!context.hidden ? "bg-blue-700 border-blue-700 text-white border font-bold" : null}`}
        onClick={toggleLeaderboard}
      >
        <div className="flex justify-center gap-2">
          {context.hidden === false ? (
            <ChevronLeftIcon className="h-5 w-5 my-auto" />
          ) : null}
          {leaderboardText}
        </div>
      </button>
      <Modal isOpen={showModal} closeModal={closeModal}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default TournamentButtons;
