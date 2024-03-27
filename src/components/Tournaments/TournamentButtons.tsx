"use client";

import { useState, ReactNode } from "react";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import Addplayer from "@/components/addplayer";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";

const TournamentButtons = () => {
  const t = useTranslations("Tournament.Buttons");
  const context = useTournamentContext();

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const closeModal = () => {
    setShowModal(false);
  };
  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  const emptyTable = () => {
    if (window.confirm(t("emptyConfirm"))) {
      // logic here
    }
  };
  return (
    <div className="container mx-auto p-2 flex flex-col md:flex-row gap-4">
      <button
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
        onClick={() => openModal(<AddMatch closeModal={closeModal} />)}
      >
        {t("addmatch")}
      </button>
      <button
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
        onClick={() => openModal(<Addplayer closeModal={closeModal} />)}
      >
        {t("addplayer")}
      </button>
      <button
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600 text-center"
        onClick={() => context.setHidden(!context.hidden)}
      >
        {t("leaderboard")}
      </button>
      <button
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
        onClick={emptyTable}
      >
        {t("empty")}
      </button>
      <Modal isOpen={showModal} closeModal={closeModal}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default TournamentButtons;
