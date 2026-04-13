"use client";

import { useState, ReactNode, useEffect } from "react";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import Addplayer from "@/components/addplayer";
import QRMatchModal from "@/components/QRMatchModal";
import BulkMatchEntry from "@/components/BulkMatchEntry";
import PoolManagement from "@/components/PoolManagement";
import RoundManagement from "@/components/RoundManagement";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button";
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
    if (!account.user) return;
    async function fetchPlayerNames() {
      const fetchPlayers = await getPlayer();
      if (!fetchPlayers.success) {
        console.log("Error: " + fetchPlayers.error);
        return;
      }
      setPlayersList(fetchPlayers.value);
    }
    fetchPlayerNames();
  }, [account.user]);

  const isSeeded = context.players.some(
    (player) => player && player.player.bracket_seed,
  );

  const activeRoundType = context.rounds.find(
    (r) => r.round_order === context.activeRound,
  )?.type;
  const isRoundRobin = activeRoundType === "pools";
  const isAuthenticated = account.user !== null;
  // When players are seeded, hide match/player entry actions but keep
  // admin management buttons (Manage Rounds, Manage Pools) and the
  // leaderboard toggle visible.
  const showEntryActions = !isSeeded;

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
      {showEntryActions && isRoundRobin && isAuthenticated && (
        <Button
          variant="secondary"
          onClick={() => openModal(<AddMatch closeModal={closeModal} />)}
        >
          {t("addmatch")}
        </Button>
      )}
      {showEntryActions && isAuthenticated && (
        <Button
          variant="secondary"
          onClick={() => openModal(<QRMatchModal closeModal={closeModal} />)}
        >
          {t("qrMatch")}
        </Button>
      )}
      {showEntryActions &&
      isRoundRobin &&
      account.user?.role === "admin" ? (
        <Button
          variant="secondary"
          onClick={() => openModal(<BulkMatchEntry closeModal={closeModal} />)}
        >
          {t("dtEntry")}
        </Button>
      ) : null}
      {isRoundRobin && account.user?.role === "admin" ? (
        <Button
          variant="secondary"
          onClick={() => openModal(<PoolManagement closeModal={closeModal} />)}
        >
          {t("managePools")}
        </Button>
      ) : null}
      {account.user?.role === "admin" ? (
        <Button
          variant="secondary"
          onClick={() => openModal(<RoundManagement closeModal={closeModal} />)}
        >
          {t("manageRounds")}
        </Button>
      ) : null}
      {showEntryActions && isAuthenticated && (
        <Button
          variant="secondary"
          onClick={() =>
            openModal(
              <Addplayer closeModal={closeModal} playerList={playersList} />,
            )
          }
        >
          {t("addplayer")}
        </Button>
      )}
      <Button
        variant={context.hidden ? "secondary" : "primary"}
        onClick={toggleLeaderboard}
      >
        <div className="flex justify-center gap-2">
          {context.hidden === false ? (
            <ChevronLeftIcon className="h-5 w-5 my-auto" />
          ) : null}
          {leaderboardText}
        </div>
      </Button>
      <Modal isOpen={showModal} closeModal={closeModal}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default TournamentButtons;
