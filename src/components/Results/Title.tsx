"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { useState } from "react";
import Modal from "../modal";
import { useTranslations } from "next-intl";

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
  const [input, setInput] = useState<string>("");
  const [requireIdentity, setRequireIdentity] = useState(false);

  const handleSave = async () => {
    if (!context.tournament) return
    setLoading(true);
    const request = {
      name: input.trim(),
      id: Number(context.tournament.id),
      require_submitter_identity: requireIdentity,
    };

    if (!request.name) {
      alert(t("emptyname"));
      setLoading(false);
      return;
    }

    const res = await fetch("/api/tournament/name", {
      method: "POST",
      body: JSON.stringify(request),
    });

    if (res.ok) {
      const update = {
        ...context.tournament,
        name: request.name,
        require_submitter_identity: requireIdentity,
      } as typeof context.tournament;
      context.setTournament(update);
      setLoading(false);
    }

    setLoading(false);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
  };
  const openModal = () => {
    setInput(context.tournament?.name || "");
    setRequireIdentity(context.tournament?.require_submitter_identity || false);
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
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <button
              disabled={loading}
              onClick={handleSave}
              type="button"
              className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t("submit")}
            </button>
            <button
              onClick={closeModal}
              className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              type="button"
            >
              {t("back")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
