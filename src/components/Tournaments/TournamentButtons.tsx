"use client";

import { useState, ReactNode, useEffect } from "react";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import Addplayer from "@/components/addplayer";
import QRMatchModal from "@/components/QRMatchModal";
import BulkMatchEntry from "@/components/BulkMatchEntry";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { getPlayer } from "@/database/getPlayers";

const TournamentButtons = () => {
  const t = useTranslations("Tournament.Buttons");
  const context = useTournamentContext();
  const account = useUserContext();

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

  return (
    <div className="container mx-auto p-2 flex flex-col md:flex-row gap-4">
      {isRoundRobin && (
        <button
          type="button"
          className="p-1 px-5 border rounded-md shadow-xs border-slate-600"
          onClick={() => openModal(<AddMatch closeModal={closeModal} />)}
        >
          {t("addmatch")}
        </button>
      )}
      <button
        type="button"
        className="p-1 px-5 border rounded-md shadow-xs border-slate-600 bg-green-50 border-green-500 text-green-700"
        onClick={() => openModal(<QRMatchModal closeModal={closeModal} />)}
      >
        {t("qrMatch")}
      </button>
      {context.tournament?.format === "Round Robin" && account.user?.role === "admin" ? (
        <button
          type="button"
          className="p-1 px-5 border rounded-md shadow-xs border-slate-600 bg-amber-50 border-amber-500 text-amber-700"
          onClick={() => openModal(<BulkMatchEntry closeModal={closeModal} />)}
        >
          {t("dtEntry")}
        </button>
      ) : null}
      <button
        type="button"
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
        type="button"
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
