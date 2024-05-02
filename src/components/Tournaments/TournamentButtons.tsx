"use client";

import { useState, ReactNode } from "react";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import Addplayer from "@/components/addplayer";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import Link from "next/link";

const TournamentButtons = () => {
  const t = useTranslations("Tournament.Buttons");
  const context = useTournamentContext();

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [leaderboardText, setLeaderboardText] = useState(t("leaderboard"));
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
  return (
    <div className="container mx-auto p-2 flex flex-col md:flex-row gap-4">
      {context.tournament?.format === "Round Robin" ? (
        <button
          className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
          onClick={() => openModal(<AddMatch closeModal={closeModal} />)}
        >
          {t("addmatch")}
        </button>
      ) : null}
      <button
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
        onClick={() => openModal(<Addplayer closeModal={closeModal} />)}
      >
        {t("addplayer")}
      </button>
      <button
        className={`p-1 px-5 border rounded-md shadow-sm border-slate-600 text-center ${!context.hidden ? "bg-blue-700 text-white border-0 font-bold" : null}`}
        onClick={toggleLeaderboard}
      >
        {leaderboardText}
      </button>
      <Modal isOpen={showModal} closeModal={closeModal}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default TournamentButtons;
