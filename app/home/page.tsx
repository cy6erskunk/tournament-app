"use client";

import { useState } from "react";
import Navbar from "../components/navbar";
import ResultsTable from "../components/resultsTable";
import Link from "next/link";
import Modal from "../components/modal";
import Addplayer from "../components/addplayer";
import { ReactNode } from "react";
import LeaderboardHome from "../components/leaderboardHome";
import AddMatch from "../components/newmatch";

const Page = () => {
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
    <div>
      <Navbar />
      <div className="flex flex-row">
        {/*Style later when everything figured out, desktop view looks bad  */}
        <section className="container mx-auto p-2 flex flex-col md:flex-row">
          <div className="flex flex-col my-auto gap-4 max-w-60">
            <button
              className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
              onClick={() => openModal(<AddMatch closeModal={closeModal} />)}
            >
              Add match
            </button>
            <button
              className="p-1 px-5 border rounded-md shadow-sm border-slate-600"
              onClick={() => openModal(<Addplayer closeModal={closeModal} />)}
            >
              Add player
            </button>
            <Link
              href="/leaderboard"
              className="p-1 px-5 border rounded-md shadow-sm border-slate-600 text-center"
            >
              Tulostaulu
            </Link>
          </div>
        </section>
      </div>
      <Modal isOpen={showModal}>{modalContent}</Modal>
      <section className="container mx-auto p-2">
        <div className="flex flex-col md:flex-row gap-3 *:grow">
          <ResultsTable />
          <LeaderboardHome />
        </div>
      </section>
    </div>
  );
};

export default Page;
