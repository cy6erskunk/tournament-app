"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

interface AddPlayerToTournamentModalProps {
  tournamentId: number;
  availablePlayers: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPlayerToTournamentModal({
  tournamentId,
  availablePlayers,
  isOpen,
  onClose,
  onSuccess,
}: AddPlayerToTournamentModalProps) {
  const t = useTranslations("Admin.tournamentUsers");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!selectedPlayer) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/players`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName: selectedPlayer }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add player");
      }

      setSelectedPlayer("");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSelectedPlayer("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("addPlayer")}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {availablePlayers.length === 0 ? (
        <div className="mb-6">
          <p className="text-sm text-gray-500">{t("noAvailablePlayers")}</p>
        </div>
      ) : (
        <div className="mb-6">
          <label
            htmlFor="player-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("selectPlayer")}
          </label>
          <select
            id="player-select"
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            <option value="">{t("selectPlayer")}</option>
            {availablePlayers.map((player) => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={handleAdd}
          disabled={loading || !selectedPlayer}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
        >
          {loading ? t("adding") : t("add")}
        </button>
      </div>
    </Modal>
  );
}
