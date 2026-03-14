"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { useState } from "react";
import Modal from "../modal";
import { useTranslations } from "next-intl";
import Button from "@/components/Button";

export function TournamentTitle() {
  const context = useTournamentContext();
  const account = useUserContext()

  const name = context.tournament?.name || ""

  const getEditing = () => {
    if (!account.user) return
    if (account.user.role !== "admin") return

    return <EditButton />
  }

  if (context.loading || !context.tournament) {
    return (
      <div><span className="invisible"></span></div>
    )
  }
  return (
    <div className="flex flex-col xl:flex-row xl:gap-10 xl:items-center">
      <span>{name}</span>
      {getEditing()}
    </div>
  );
}

function EditButton() {
  const context = useTournamentContext()
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("AddPlayer");
  const tBrackets = useTranslations("Brackets");
  const [input, setInput] = useState<string>("");
  const [requireIdentity, setRequireIdentity] = useState(false);
  const [publicResults, setPublicResults] = useState(false);
  const [placementSize, setPlacementSize] = useState<number | null>(null);
  const isRoundRobin = context.tournament?.format === "Round Robin";
  const isBrackets = context.tournament?.format === "Brackets";

  const handleSave = async () => {
    if (!context.tournament) return
    setLoading(true);
    const request = {
      name: input.trim(),
      id: Number(context.tournament.id),
      require_submitter_identity: requireIdentity,
      public_results: isRoundRobin ? publicResults : undefined,
      placement_size: isBrackets ? placementSize : undefined,
    };

    if (!request.name) {
      alert(t("emptyname"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/tournament/name", {
        method: "POST",
        body: JSON.stringify(request),
      });

      if (res.ok) {
        const update = {
          ...context.tournament,
          name: request.name,
          require_submitter_identity: requireIdentity,
          ...(isRoundRobin ? { public_results: publicResults } : {}),
          ...(isBrackets ? { placement_size: placementSize } : {}),
        } as typeof context.tournament;
        context.setTournament(update);
      }
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };
  const openModal = () => {
    setInput(context.tournament?.name || "");
    setRequireIdentity(context.tournament?.require_submitter_identity || false);
    setPublicResults(context.tournament?.public_results || false);
    setPlacementSize(context.tournament?.placement_size ?? null);
    setShowModal(true);
  };

  if (!context.tournament) {
    return
  }

  return (
    <div className="flex gap-4 py-4">
      <button type="button" className="text-base text-slate-500 cursor-pointer" onClick={() => openModal()}>{t("edittournament")}</button>

      <Modal isOpen={showModal} closeModal={closeModal}>
        <div className="space-y-6">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            {t("edittournament")}
          </h2>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              {t("tournamentname")}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
              className="flex w-full justify-center rounded-md border-0 py-1.5 px-3 shadow-xs ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
            />
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="checkbox"
              name="requireIdentity"
              id="edit-requireIdentity"
              checked={requireIdentity}
              onChange={(e) => setRequireIdentity(e.target.checked)}
            />
            <label htmlFor="edit-requireIdentity" className="text-sm">
              {t("requiresubmitteridentity")}
            </label>
          </div>
          {isRoundRobin && (
            <div className="flex gap-3 items-center">
              <input
                type="checkbox"
                name="publicResults"
                id="edit-publicResults"
                checked={publicResults}
                onChange={(e) => setPublicResults(e.target.checked)}
              />
              <label htmlFor="edit-publicResults" className="text-sm">
                {t("publicresults")}
              </label>
            </div>
          )}
          {isBrackets && (
            <div className="flex flex-col gap-2">
              <label htmlFor="edit-placementSize" className="text-sm font-medium">
                {tBrackets("placementSize")}
              </label>
              <select
                id="edit-placementSize"
                name="placementSize"
                className="rounded-md shadow-xs border border-gray-300 p-2 text-sm"
                value={placementSize ?? ""}
                onChange={(e) =>
                  setPlacementSize(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">{tBrackets("placementSizeNone")}</option>
                {[4, 8, 16, 32].map((size) => (
                  <option key={size} value={size}>
                    {tBrackets("placementSizeLabel", { size })}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <Button disabled={loading} onClick={handleSave} variant="primary" fullWidth>
              {t("submit")}
            </Button>
            <Button onClick={closeModal} variant="secondary" fullWidth>
              {t("back")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
