"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button";
import { RoundType } from "@/database/getRounds";

interface RoundManagementProps {
  closeModal: () => void;
}

export default function RoundManagement({ closeModal }: RoundManagementProps) {
  const t = useTranslations("Round");
  const context = useTournamentContext();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<RoundType>("pools");
  const [error, setError] = useState<string | null>(null);

  const tournamentId = context.tournament?.id;

  async function handleCreateRound() {
    if (!tournamentId) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournament/${tournamentId}/rounds`, {
        method: "POST",
        body: JSON.stringify({ type: selectedType }),
      });

      if (!res.ok) {
        setError(t("createFailed"));
        return;
      }

      const round = await res.json();
      context.setRounds((prev) => [...prev, round]);
    } catch {
      setError(t("createFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteRound(roundId: number) {
    if (!tournamentId) return;
    setDeleting(roundId);
    setError(null);

    try {
      const res = await fetch(`/api/tournament/${tournamentId}/rounds`, {
        method: "DELETE",
        body: JSON.stringify({ roundId }),
      });

      if (!res.ok) {
        setError(t("deleteFailed"));
        return;
      }

      context.setRounds((prev) => {
        const deleted = prev.find((r) => r.id === roundId);
        const remaining = prev.filter((r) => r.id !== roundId);
        // If the deleted round was active, switch to the first remaining
        // round, or reset to 0 when no rounds remain.
        if (deleted && deleted.round_order === context.activeRound) {
          context.setActiveRound(
            remaining.length > 0 ? remaining[0].round_order : 0,
          );
        }
        return remaining;
      });
    } catch {
      setError(t("deleteFailed"));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
      <h2 className="text-xl font-bold">{t("title")}</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Create new round */}
      <div className="flex gap-2 items-center">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as RoundType)}
          className="border border-slate-300 rounded px-2 py-2 text-sm"
          aria-label={t("selectType")}
        >
          <option value="pools">{t("typePool")}</option>
          <option value="elimination">{t("typeElimination")}</option>
        </select>
        <Button onClick={handleCreateRound} disabled={creating} className="text-sm">
          {creating ? t("creating") : t("createRound")}
        </Button>
      </div>

      {/* Existing rounds */}
      {context.rounds.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-sm text-slate-600">{t("rounds")}</h3>
          {context.rounds.map((round) => (
            <div
              key={round.id}
              className="flex items-center justify-between border border-slate-200 rounded px-3 py-2"
            >
              <span className="font-medium">
                {round.round_order}.{" "}
                {round.type === "elimination"
                  ? t("typeElimination")
                  : t("typePool")}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteRound(round.id)}
                disabled={deleting === round.id}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                aria-label={`${t("deleteRound")} ${round.round_order}`}
              >
                {deleting === round.id ? (
                  <span className="text-xs">{t("deleting")}</span>
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <Button variant="secondary" fullWidth onClick={closeModal} className="mt-2">
        {t("close")}
      </Button>
    </div>
  );
}
