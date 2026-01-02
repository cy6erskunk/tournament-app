"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import Modal from "@/components/modal";
import NewPlayer from "@/components/newplayer";
import { useTournamentContext } from "@/context/TournamentContext";

export default function TournamentNavbarContent() {
  const t = useTranslations("Logout");
  const context = useTournamentContext();
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);

  const isSeeded = context.players.some(
    (player) => player && player.player.bracket_seed,
  );

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };

  return (
    <>
      <Link
        className="text-white hover:text-blue-900 text-base font-bold py-3 px-5"
        href="/select"
      >
        {t("returntotournaments")}
      </Link>
      {!isSeeded ? (
        <button
          className="bg-white hover:bg-violet-500 hover:text-white text-blue-500 text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full m-1 relative justify-center"
          onClick={() => openModal(<NewPlayer closeModal={closeModal} />)}
        >
          {t("newplayer")}
        </button>
      ) : null}
      <Modal isOpen={showModal} closeModal={closeModal}>
        {modalContent}
      </Modal>
    </>
  );
}
