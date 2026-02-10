"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import CreatePlayerModal from "./CreatePlayerModal";
import EditPlayerModal from "./EditPlayerModal";

export default function TournamentUsersManagement() {
  const t = useTranslations("Admin.tournamentUsers");
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/players");
      if (!res.ok) throw new Error("Failed to fetch players");
      setAllPlayers(await res.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handlePlayerCreated = () => {
    setCreateModalOpen(false);
    fetchPlayers();
  };

  const handlePlayerEdited = () => {
    setEditingPlayer(null);
    fetchPlayers();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (error && allPlayers.length === 0) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{t("error")}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-gray-700">{t("description")}</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {t("createPlayer")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        {t("playerCount", { count: allPlayers.length })}
      </div>

      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      {t("playerName")}
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">{t("actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {allPlayers.map((playerName) => (
                    <tr key={playerName}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {playerName}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          type="button"
                          onClick={() => setEditingPlayer(playerName)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {t("edit")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allPlayers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">{t("noPlayers")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreatePlayerModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handlePlayerCreated}
      />

      {editingPlayer && (
        <EditPlayerModal
          playerName={editingPlayer}
          isOpen={true}
          onClose={() => setEditingPlayer(null)}
          onSuccess={handlePlayerEdited}
        />
      )}
    </>
  );
}
