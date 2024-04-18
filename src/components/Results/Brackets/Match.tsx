import { Player } from "@/types/Player";
import { Match, Round } from "./Tournament";
import Modal from "@/components/modal";
import AddMatch from "@/components/newmatch";
import { useState } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { useTournamentContext } from "@/context/TournamentContext";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useUserContext } from "@/context/UserContext";
import { PlayerData } from "@/app/api/removeplayer/route";

type MatchProps = {
  competitors: (Player | undefined)[];
  match: Match;
  round: Round;
};

export default function Match({ competitors, match, round }: MatchProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const context = useTournamentContext()
  const account = useUserContext()

  const getRemoveButton = (competitor: Player | undefined) => {
    if (!account.user) return
    if (account.user.role !== "admin") return
    if (!competitor?.player.player_name) return

    return (
      <button
        onClick={() => removePlayer(competitor)}
        className="bg-red-400 p-1 rounded-full hover:bg-red-500 disabled:bg-slate-400"
        disabled={loading}
      >
        <TrashIcon className="w-5 aspect-square text-white" />
      </button>
    )
  }

  const closeModal = () => {
    setShowModal(false);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const removePlayer = async (player: Player) => {
    setLoading(true);

    const data: PlayerData = {
      name: player.player.player_name,
      tournamentId: player.player.tournament_id
    }

    const res = await fetch("/api/removeplayer", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      alert("Error removing player");
      setLoading(false);
      return;
    }

    context.setPlayers((prev) => prev.filter(p => p.player.player_name !== player.player.player_name))
    setLoading(false);
  }

  const getMatch = (competitor: Player | undefined, index: number) => {
    if (!competitor) {
      // Create empty competitor object
      competitor = {
        player: {
          player_name: "",
          tournament_id: 0
        },
        matches: []
      }
    }
    const playerKey =
      match.player1?.player.player_name === competitor.player.player_name
        ? "player1"
        : "player2";

    const isWinner = match.winner === competitor.player.player_name;
    const isLoser = match.winner && match.winner !== competitor.player.player_name;

    return (
      <div
        key={`${index}-${match.match}-${round.id}`}
        className={`flex items-center px-1 py-1 leading-relaxed relative w-full border-2 border-slate-500 rounded-md shadow-md ${isWinner
          ? "bg-green-500"
          : "bg-white *:text-gray-800"
          }`}
      >
        <div className="flex gap-4 items-center w-full">
          <div className="flex w-10 aspect-square rounded-md items-center bg-slate-200">
            <span className="text-center w-full font-mono"> {match[`${playerKey}_hits`]}</span>
          </div>

          <div className="flex justify-between w-full">
            <div className="flex gap-4">
              <span className={`text-xl font-bold ${isLoser ? "line-through" : ""}`}>
                {competitor.player.player_name}
              </span>
              {getRemoveButton(competitor)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>{`Match: ${match.match}`}</span>
              <span>{`Round: ${match.round}`}</span>
            </div>
          </div>
        </div>
      </div >
    );
  };

  if (!competitors.length) return;

  const notPlayed = !match.winner && match.player1 && match.player2

  return (
    <div className="flex justify-center items-center gap-2">
      <span className="text-slate-400 py-8">{match.round}</span>
      <div className="overflow-auto w-full flex gap-2 flex-col">
        {competitors.map((player, index) => getMatch(player, index))}
      </div>

      {notPlayed ? (
        <>
          <button onClick={() => openModal()}>
            <PlusCircleIcon className="h-8 w-8 hover:text-blue-600" />
          </button>
          <Modal isOpen={showModal} closeModal={closeModal}>
            <AddMatch closeModal={closeModal} bracketMatch={match} />
          </Modal>
        </>
      ) : null}
    </div>
  );
}
