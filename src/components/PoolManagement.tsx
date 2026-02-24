"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTournamentContext } from "@/context/TournamentContext";
import { TrashIcon } from "@heroicons/react/24/outline";

interface PoolManagementProps {
  closeModal: () => void;
}

export default function PoolManagement({ closeModal }: PoolManagementProps) {
  const t = useTranslations("Pool");
  const context = useTournamentContext();
  const [newPoolName, setNewPoolName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tournamentId = context.tournament?.id;

  async function handleCreatePool() {
    if (!newPoolName.trim() || !tournamentId) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/tournament/${tournamentId}/pools`, {
        method: "POST",
        body: JSON.stringify({ name: newPoolName.trim() }),
      });

      if (!res.ok) {
        setError(t("createFailed"));
        return;
      }

      const pool = await res.json();
      context.setPools((prev) => [...prev, pool]);
      setNewPoolName("");
    } catch {
      setError(t("createFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePool(poolId: number) {
    if (!tournamentId) return;
    setDeleting(poolId);
    setError(null);

    try {
      const res = await fetch(`/api/tournament/${tournamentId}/pools`, {
        method: "DELETE",
        body: JSON.stringify({ poolId }),
      });

      if (!res.ok) {
        setError(t("deleteFailed"));
        return;
      }

      context.setPools((prev) => prev.filter((p) => p.id !== poolId));
      // Unassign players that were in this pool
      context.setPlayers((prev) =>
        prev.map((p) => {
          if (!p || p.player.pool_id !== poolId) return p;
          return { ...p, player: { ...p.player, pool_id: null } };
        }),
      );
    } catch {
      setError(t("deleteFailed"));
    } finally {
      setDeleting(null);
    }
  }

  async function handleAssignPlayer(playerName: string, poolId: number | null) {
    if (!tournamentId) return;
    setAssigning(playerName);
    setError(null);

    try {
      // poolId of 0 means unassign (remove from pool) - handled by the API route
      const targetPoolId = poolId === null ? 0 : poolId;
      const res = await fetch(
        `/api/tournament/${tournamentId}/pools/${targetPoolId}/players`,
        {
          method: "POST",
          body: JSON.stringify({ playerName }),
        },
      );

      if (!res.ok) {
        setError(t("assignFailed"));
        return;
      }

      context.setPlayers((prev) =>
        prev.map((p) => {
          if (!p || p.player.player_name !== playerName) return p;
          return { ...p, player: { ...p.player, pool_id: poolId } };
        }),
      );
    } catch {
      setError(t("assignFailed"));
    } finally {
      setAssigning(null);
    }
  }

  const players = context.players.filter((p) => p !== null);

  return (
    <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
      <h2 className="text-xl font-bold">{t("title")}</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Create new pool */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPoolName}
          onChange={(e) => setNewPoolName(e.target.value)}
          placeholder={t("poolNamePlaceholder")}
          className="border border-slate-300 rounded px-3 py-1 flex-1 text-sm"
          maxLength={64}
          onKeyDown={(e) => e.key === "Enter" && handleCreatePool()}
        />
        <button
          type="button"
          onClick={handleCreatePool}
          disabled={creating || !newPoolName.trim()}
          className="px-4 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {creating ? t("creating") : t("createPool")}
        </button>
      </div>

      {/* Existing pools */}
      {context.pools.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-sm text-slate-600">{t("pools")}</h3>
          {context.pools.map((pool) => (
            <div
              key={pool.id}
              className="flex items-center justify-between border border-slate-200 rounded px-3 py-2"
            >
              <span className="font-medium">{pool.name}</span>
              <button
                type="button"
                onClick={() => handleDeletePool(pool.id)}
                disabled={deleting === pool.id}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                aria-label={`${t("deletePool")} ${pool.name}`}
              >
                {deleting === pool.id ? (
                  <span className="text-xs">{t("deleting")}</span>
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Player pool assignment */}
      {players.length > 0 && context.pools.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-sm text-slate-600">
            {t("assignPlayers")}
          </h3>
          {players.map((player) => {
            if (!player) return null;
            const currentPool = context.pools.find(
              (p) => p.id === player.player.pool_id,
            );
            return (
              <div
                key={player.player.player_name}
                className="flex items-center justify-between border border-slate-200 rounded px-3 py-2 gap-2"
              >
                <span className="text-sm font-medium min-w-0 truncate">
                  {player.player.player_name}
                </span>
                <select
                  value={player.player.pool_id ?? ""}
                  disabled={assigning === player.player.player_name}
                  onChange={(e) =>
                    handleAssignPlayer(
                      player.player.player_name,
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  className="border border-slate-300 rounded px-2 py-1 text-sm"
                  aria-label={`${t("poolFor")} ${player.player.player_name}`}
                >
                  <option value="">{t("noPool")}</option>
                  {context.pools.map((pool) => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name}
                    </option>
                  ))}
                </select>
                {assigning === player.player.player_name && (
                  <span className="text-xs text-slate-500">{t("saving")}</span>
                )}
                {currentPool && assigning !== player.player.player_name && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {currentPool.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={closeModal}
        className="mt-2 p-2 border rounded-md text-sm text-slate-600 hover:bg-slate-50"
      >
        {t("close")}
      </button>
    </div>
  );
}
