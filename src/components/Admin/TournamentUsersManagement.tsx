"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import AddPlayerToTournamentModal from "./AddPlayerToTournamentModal";
import RemovePlayerFromTournamentModal from "./RemovePlayerFromTournamentModal";
import CreatePlayerModal from "./CreatePlayerModal";
import EditPlayerModal from "./EditPlayerModal";

interface TournamentOption {
  id: number;
  name: string;
}

export default function TournamentUsersManagement() {
  const t = useTranslations("Admin.tournamentUsers");
  const [allPlayers, setAllPlayers] = useState<string[]>([]);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    number | null
  >(null);
  const [tournamentPlayerNames, setTournamentPlayerNames] = useState<string[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [playersRes, tournamentsRes] = await Promise.all([
        fetch("/api/admin/players"),
        fetch("/api/admin/tournaments"),
      ]);

      if (!playersRes.ok) throw new Error("Failed to fetch players");
      if (!tournamentsRes.ok) throw new Error("Failed to fetch tournaments");

      const playersData = await playersRes.json();
      const tournamentsData = await tournamentsRes.json();

      setAllPlayers(playersData);
      setTournaments(tournamentsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTournamentPlayers = useCallback(
    async (tournamentId: number) => {
      try {
        const res = await fetch(
          `/api/admin/tournaments/${tournamentId}/players`,
        );
        if (!res.ok) throw new Error("Failed to fetch tournament players");
        const data = await res.json();
        const names = data.players.map(
          (p: { player: { player_name: string } }) => p.player.player_name,
        );
        setTournamentPlayerNames(names);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [],
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedTournamentId !== null) {
      fetchTournamentPlayers(selectedTournamentId);
    } else {
      setTournamentPlayerNames([]);
    }
  }, [selectedTournamentId, fetchTournamentPlayers]);

  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTournamentId(value ? parseInt(value, 10) : null);
  };

  const refreshData = async () => {
    const playersRes = await fetch("/api/admin/players");
    if (playersRes.ok) {
      setAllPlayers(await playersRes.json());
    }
    if (selectedTournamentId !== null) {
      await fetchTournamentPlayers(selectedTournamentId);
    }
  };

  const handlePlayerAdded = () => {
    setAddModalOpen(false);
    refreshData();
  };

  const handlePlayerRemoved = () => {
    setRemovingPlayer(null);
    refreshData();
  };

  const handlePlayerCreated = () => {
    setCreateModalOpen(false);
    refreshData();
  };

  const handlePlayerEdited = () => {
    setEditingPlayer(null);
    refreshData();
  };

  const isFiltered = selectedTournamentId !== null;
  const displayedPlayers = isFiltered
    ? allPlayers.filter((name) => tournamentPlayerNames.includes(name))
    : allPlayers;
  const availablePlayers = isFiltered
    ? allPlayers.filter((name) => !tournamentPlayerNames.includes(name))
    : [];

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

      <div className="mt-6 sm:flex sm:items-end sm:justify-between">
        <div>
          <label
            htmlFor="tournament-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("filterByTournament")}
          </label>
          <select
            id="tournament-filter"
            value={selectedTournamentId ?? ""}
            onChange={handleTournamentChange}
            className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
          >
            <option value="">{t("allTournaments")}</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
        {isFiltered && (
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {t("addPlayer")}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        {t("playerCount", { count: displayedPlayers.length })}
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
                  {displayedPlayers.map((playerName) => (
                    <tr key={playerName}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {playerName}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          type="button"
                          onClick={() => setEditingPlayer(playerName)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          {t("edit")}
                        </button>
                        {isFiltered && (
                          <button
                            type="button"
                            onClick={() => setRemovingPlayer(playerName)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t("remove")}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayedPlayers.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">
                    {isFiltered ? t("noPlayersInTournament") : t("noPlayers")}
                  </p>
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

      {isFiltered && (
        <>
          <AddPlayerToTournamentModal
            tournamentId={selectedTournamentId}
            availablePlayers={availablePlayers}
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSuccess={handlePlayerAdded}
          />

          {removingPlayer && (
            <RemovePlayerFromTournamentModal
              tournamentId={selectedTournamentId}
              playerName={removingPlayer}
              isOpen={true}
              onClose={() => setRemovingPlayer(null)}
              onSuccess={handlePlayerRemoved}
            />
          )}
        </>
      )}
    </>
  );
}
