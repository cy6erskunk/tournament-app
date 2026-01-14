"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { QRAuditLog as QRAuditLogType } from "@/database/getQRAuditLogs";

export default function QRAuditLog() {
  const t = useTranslations("Admin.qrAudit");
  const [logs, setLogs] = useState<QRAuditLogType[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<QRAuditLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string>("all");
  const [selectedSubmitter, setSelectedSubmitter] = useState<string>("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/qr-audit");
      if (!response.ok) {
        throw new Error("Failed to fetch QR audit logs");
      }
      const data = await response.json();
      setLogs(data);
      setFilteredLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (selectedTournament !== "all") {
      filtered = filtered.filter(
        (log) => log.tournament_id.toString() === selectedTournament
      );
    }

    if (selectedSubmitter !== "all") {
      filtered = filtered.filter(
        (log) => log.submitter_name === selectedSubmitter
      );
    }

    setFilteredLogs(filtered);
  }, [selectedTournament, selectedSubmitter, logs]);

  const formatDate = (timestamp: Date | string | null) => {
    if (!timestamp) return t("unknown");
    return new Date(timestamp).toLocaleString();
  };

  const uniqueTournaments = Array.from(
    new Map(logs.map((log) => [log.tournament_id, log.tournament_name]))
  );

  const uniqueSubmitters = Array.from(
    new Set(logs.map((log) => log.submitter_name).filter((name) => name))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
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
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-gray-700">{t("description")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tournament-filter"
            className="block text-sm font-medium text-gray-700"
          >
            {t("filterByTournament")}
          </label>
          <select
            id="tournament-filter"
            value={selectedTournament}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{t("allTournaments")}</option>
            {uniqueTournaments.map(([id, name]) => (
              <option key={id} value={id.toString()}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="submitter-filter"
            className="block text-sm font-medium text-gray-700"
          >
            {t("filterBySubmitter")}
          </label>
          <select
            id="submitter-filter"
            value={selectedSubmitter}
            onChange={(e) => setSelectedSubmitter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="all">{t("allSubmitters")}</option>
            {uniqueSubmitters.map((name) => (
              <option key={name} value={name || ""}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 flow-root">
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
                      {t("tournament")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("round")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("match")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("players")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("score")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("winner")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("submitter")}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      {t("submittedAt")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {log.tournament_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.round}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.match_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.player1} {t("vs")} {log.player2}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.player1_hits} - {log.player2_hits}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.winner}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {log.submitter_name || t("unknown")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(log.submitted_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">{t("noLogs")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
