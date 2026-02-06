"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "./Modal";

interface RemovePlayerFromTournamentModalProps {
  tournamentId: number;
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RemovePlayerFromTournamentModal({
  tournamentId,
  playerName,
  isOpen,
  onClose,
  onSuccess,
}: RemovePlayerFromTournamentModalProps) {
  const t = useTranslations("Admin.tournamentUsers");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/players`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove player");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("removePlayer")}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-gray-700">
          {t("removeConfirmation")}{" "}
          <strong className="text-gray-900">{playerName}</strong>?
        </p>
        <p className="text-sm text-red-600 mt-2">{t("removeWarning")}</p>
      </div>

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
          onClick={handleRemove}
          disabled={loading}
          className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
        >
          {loading ? t("removing") : t("remove")}
        </button>
      </div>
    </Modal>
  );
}
