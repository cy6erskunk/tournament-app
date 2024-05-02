"use client";

import { FormEvent, useState } from "react";
import { createTournament } from "@/database/addTournament";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

function NewTournament() {
  const t = useTranslations("Select");
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState("Round Robin");
  const [loading, setLoading] = useState(false);
  const defaultValue = `${selectedFormat} ${new Date().toLocaleDateString(
    "en-GB",
  )}`;
  const onTournamentFormatChange = (e: FormEvent<HTMLInputElement>) => {
    setSelectedFormat(e.currentTarget.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentDate = new Date();

    const tournament = {
      format: formData.get("format") as string,
      name: formData.get("tournamentName") as string,
      date: currentDate,
    };

    const newTournament = await createTournament(
      tournament.date,
      tournament.format,
      tournament.name.trim() || defaultValue,
    );

    if (!newTournament.success) {
      console.log("Error:" + " " + newTournament.error);
      alert(t("createfailed"));
      setLoading(false);
      return;
    }

    router.push(`/tournament/${newTournament.value.id}`);
  };

  return (
    <section className="flex flex-col space-y-5">
      <p className="font-bold text-xl">{t("createtournament")}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <input
            type="radio"
            name="format"
            value="Round Robin"
            id="Round Robin"
            checked={selectedFormat === "Round Robin"}
            onChange={onTournamentFormatChange}
          />
          {/*eslint-disable-next-line -- no need to translate this*/}
          <label htmlFor="Round Robin">Round robin</label>
          <input
            type="radio"
            name="format"
            value="Brackets"
            id="Brackets"
            checked={selectedFormat === "Brackets"}
            onChange={onTournamentFormatChange}
          />
          {/*eslint-disable-next-line -- no need to translate this*/}
          <label htmlFor="Brackets">Brackets</label>
        </div>
        <input
          placeholder={defaultValue}
          name="tournamentName"
          className="rounded-md shadow-sm border border-black p-3"
        />
        <div>
          <button
            disabled={loading}
            type="submit"
            className="disabled:bg-blue-300 bg-blue-500 w-full py-2 px-3 text-white rounded-md shadow-sm font-semibold"
          >
            {t("submit")}
          </button>
        </div>
      </form>
    </section>
  );
}

export default NewTournament;
