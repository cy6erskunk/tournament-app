"use client";

import { useTournamentContext } from "@/context/TournamentContext";
import { useUserContext } from "@/context/UserContext";
import { useEffect, useState } from "react";
import Modal from "../modal";
import { useTranslations } from "next-intl";

export function TournamentTitle() {
  const context = useTournamentContext();
  const account = useUserContext()
  const [name, setName] = useState("")

  useEffect(() => {
    if (!context.tournament) return
    setName(context.tournament.name)
  }, [context.tournament, context.tournament?.name])

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

  const handleSave = async () => {
    if (!context.tournament) return
    setLoading(true);
    const request = {
      name: input.trim(),
      id: Number(context.tournament.id),
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
      const update = { ...context.tournament, name: request.name };
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
    setShowModal(true);
  };

  if (!context.tournament) {
    return
  }

  return (
    <div className="flex gap-4 py-4">
      <span className="text-base text-slate-500 cursor-pointer" onClick={(_) => openModal()}>Edit tournament name</span>

      <Modal isOpen={showModal} closeModal={closeModal}>
        <div className="space-y-10">
          <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Rename tournament
          </h2>
          <input
            id="name"
            name="name"
            type="text"
            onChange={(e) => setInput(e.target.value)}
            required
            placeholder={context.tournament.name}
            className="flex w-full justify-center rounded-md border-0 py-1.5 px-3 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
          />
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <button
              disabled={loading}
              onClick={handleSave}
              type="submit"
              className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm"
            >
              {t("submit")}
            </button>
            <button
              onClick={closeModal}
              className="ring-2 ring-gray-900 ring-inset py-2 w-full rounded-md shadow-sm"
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
