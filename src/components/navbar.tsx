"use client";

import { useState, ReactNode } from "react";
import Modal from "@/components/modal";
import Image from "next/image";
import Link from "next/link";
import "../../node_modules/flag-icons/css/flag-icons.min.css";
import Languages from "./languages";
import NewPlayer from "@/components/newplayer";
import { useTranslations } from "next-intl";
import { logout } from "@/helpers/logout";
import { useUserContext } from "@/context/UserContext";

interface NavbarProps {
  showNewPlayerButton?: boolean;
  isTournamentSelectionPage: boolean;
}

const Navbar = ({
  showNewPlayerButton,
  isTournamentSelectionPage,
}: NavbarProps) => {
  const t = useTranslations("Logout");
  const account = useUserContext();

  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const closeModal = () => {
    setShowModal(false);
  };
  const openModal = (content: ReactNode) => {
    setModalContent(content);
    setShowModal(true);
  };
  return (
    <nav className="p-3 bg-blue-500 flex flex-row justify-between mb-5">
      <div className="lg:hidden flex justify-center grow max-w-[150px]">
        <Image
          className="w-full h-auto object-cover object-center"
          priority
          src="/pictures/HFMlogoonly.png"
          width={500}
          height={500}
          alt="Helsingin Miekkailijat ry logo"
        />
      </div>
      <div className="max-lg:hidden flex justify-center grow max-w-md">
        <Image
          className="w-full"
          priority
          src="/pictures/HFMlogowhite.png"
          width={500}
          height={500}
          alt="Helsingin Miekkailijat ry logo"
        />
      </div>
      <div className=" flex flex-col my-auto">
        {/* <button className="bg-white hover:bg-blue-700 text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full text-blue-500 m-1">
            Empty table
          </button> */}
        <Languages />
        <div className="flex flex-col sm:flex-row pt-5 sm:pt-0">
          {!isTournamentSelectionPage ? (
            <Link
              className="text-white hover:text-blue-900 text-base font-bold py-3 px-5"
              href="/select"
            >
              {t("returntotournaments")}
            </Link>
          ) : null}
          {showNewPlayerButton ? (
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
          <button
            onClick={async () => {
              account.setUser(null);
              await logout();
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 border-2 w-full md:w-36 border-white rounded-full m-1 relative justify-center"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
