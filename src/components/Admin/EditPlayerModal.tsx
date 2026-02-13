"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "../Button";
import Modal from "./Modal";

interface EditPlayerModalProps {
  playerName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditPlayerModal({
  playerName,
  isOpen,
  onClose,
  onSuccess,
}: EditPlayerModalProps) {
  const t = useTranslations("Admin.players");
  const [newName, setNewName] = useState(playerName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || newName.trim() === playerName) return;

    if (newName.trim().length > 16) {
      setError(t("nameTooLong"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/players/${encodeURIComponent(playerName)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newName: newName.trim() }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to rename player");
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
    setNewName(playerName);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("editPlayer")}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label
            htmlFor="edit-player-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("newName")}
          </label>
          <input
            id="edit-player-name"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={16}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button onClick={handleClose} disabled={loading} variant="admin-cancel">
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={loading || !newName.trim() || newName.trim() === playerName}
            variant="admin-primary"
          >
            {loading ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
