"use client";

import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { Loading } from "./Loading";
import { Player } from "./Player";
import { TournamentTitle } from "@/components/Results/Title";
import Rounds from "@/components/rounds";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import EditMatch from "@/components/matchediting";
import { useState } from "react";
import { Player as TPlayer } from "@/types/Player";
import { useUserContext } from "@/context/UserContext";

function Tournament() {
  const t = useTranslations("Leaderboard");
  const context = useTournamentContext();
  const account = useUserContext();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalPlayer, setModalPlayer] = useState<TPlayer>();
  const [modalOpponent, setModalOpponent] = useState<TPlayer>();

  const closeModal = () => {
    setShowModal(false);
    setShowEditModal(false);
  };

  const openModal = (player: TPlayer, opponent?: TPlayer) => {
    setModalPlayer(player);

    if (opponent) {
      setModalOpponent(opponent);
    } else if (!opponent && modalOpponent) {
      setModalOpponent(undefined);
    }

    setShowModal(true);
  };

  const openEditModal = (player: TPlayer, opponent: TPlayer) => {
    setModalPlayer(player);
    setModalOpponent(opponent);
    setShowEditModal(true);
  };

  const getEditModal = () => {
    if (!modalPlayer || !modalOpponent) {
      return;
    }
    return (
      <Modal isOpen={showEditModal} closeModal={closeModal}>
        <EditMatch
          closeModal={closeModal}
          player={modalPlayer}
          opponent={modalOpponent}
        />
      </Modal>
    );
  };

  const getRemovePlayerHeading = () => {
    if (!account.user) return;
    if (account.user.role !== "admin") return;

    return <th className="w-20 min-w-20">{t("remove")}</th>;
  };

  return (
    <div className="2xl:max-w-fit lg:w-4/5">
      <div className="sm:my-2 items-center text-xl sm:text-4xl font-bold flex justify-between gap-4">
        <TournamentTitle />
        <Rounds />
      </div>

      <div className="overflow-auto border-2 border-slate-500 rounded-md shadow-md">
        <table className="w-full">
          <thead>
            <tr
              className={`${
                context.activeRound === 1 ? "*:bg-blue-500" : "*:bg-violet-500"
              } text-white *:py-4 *:sticky *:top-0 *:z-20 *:transition-all *:duration-300 *:ease-in-out`}
            >
              <th className="w-20 min-w-20">{t("name")}</th>
              <th className="w-20 min-w-20">{t("add")}</th>
              {getRemovePlayerHeading()}
              <th className="w-20 min-w-20" title="Id">
                #
              </th>
              {/* map through players and set <th>{player id}</th> */}
              {context.players.map((player, index) =>
                player ? (
                  <th className="w-20 min-w-20" key={player.player.player_name}>
                    {index + 1}
                  </th>
                ) : null,
              )}
              <th
                title={`${t("hoverWins")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("winShort")}
              </th>
              <th
                title={`${t("hoverHitsGiven")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("hitsGiven")}
              </th>
              <th
                title={`${t("hoverHitsReceived")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("hitsReceived")}
              </th>
              <th
                title={`${t("hoverAO-VO")}`}
                className="underline decoration-dotted cursor-help underline-offset-2 w-20 min-w-20"
              >
                {t("AO-VO")}
              </th>
            </tr>
          </thead>
          {!context.loading ? (
            <tbody>
              {context.players.map((player, i) =>
                player ? (
                  <Player
                    key={player.player.player_name}
                    player={player}
                    nthRow={i}
                    openModal={openModal}
                    openEditModal={openEditModal}
                  />
                ) : null,
              )}
            </tbody>
          ) : null}
        </table>
        <Loading />
        <Modal isOpen={showModal} closeModal={closeModal}>
          <AddMatch
            closeModal={closeModal}
            player={modalPlayer}
            opponent={modalOpponent}
          />
        </Modal>
        {getEditModal()}
      </div>
    </div>
  );
}

export default Tournament;
