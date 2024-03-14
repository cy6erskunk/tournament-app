"use client";

import { useState, ReactNode } from "react";
import Modal from "./modal";
import AddMatch from "./newmatch";
import Addplayer from "./addplayer";
import NewPlayer from "./newplayer";
import Link from "next/link";
import { useTranslations } from "next-intl";

const HomePageButtons = () => {
  const t = useTranslations("Home.Buttons");
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
      <Link
        href="/leaderboard"
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600 text-center"
      >
        {t("leaderboard")}
      </Link>
      <button
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
        onClick={emptyTable}
      >
        {t("empty")}
      </button>
      <button
        className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
        onClick={() => openModal(<NewPlayer closeModal={closeModal} />)}
      >
        {t("newplayer")}
      </button>
      <Modal isOpen={showModal} closeModal={closeModal}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default HomePageButtons;
