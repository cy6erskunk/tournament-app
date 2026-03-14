"use client";

import { FormEvent, useState } from "react";
import { createTournament } from "@/database/addTournament";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Button from "./Button";

function NewTournament() {
  const t = useTranslations("Select");
  const tBrackets = useTranslations("Brackets");
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState("Round Robin");
  const [requireIdentity, setRequireIdentity] = useState(false);
  const [publicResults, setPublicResults] = useState(false);
  const [placementSize, setPlacementSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const defaultValue = `${selectedFormat} ${new Date().toLocaleDateString(
    "en-GB",
  )}`;
  const onTournamentFormatChange = (e: FormEvent<HTMLInputElement>) => {
    setSelectedFormat(e.currentTarget.value);
    setPublicResults(false);
    setPlacementSize(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const currentDate = new Date();

    const format = formData.get("format") as string;
    const name = formData.get("tournamentName") as string;

    const newTournament = await createTournament(
      currentDate,
      format,
      name.trim() || defaultValue,
      requireIdentity,
      format === "Round Robin" ? publicResults : false,
      format === "Brackets" ? placementSize : null,
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
          className="rounded-md shadow-xs border border-black p-3"
        />
        <div className="flex gap-3 items-center">
          <input
            type="checkbox"
            name="requireIdentity"
            id="requireIdentity"
            checked={requireIdentity}
            onChange={(e) => setRequireIdentity(e.target.checked)}
            className="rounded-sm"
          />
          <label htmlFor="requireIdentity" className="text-sm">
            {t("requiresubmitteridentity")}
          </label>
        </div>
        {selectedFormat === "Round Robin" && (
          <div className="flex gap-3 items-center">
            <input
              type="checkbox"
              name="publicResults"
              id="publicResults"
              checked={publicResults}
              onChange={(e) => setPublicResults(e.target.checked)}
              className="rounded-sm"
            />
            <label htmlFor="publicResults" className="text-sm">
              {t("publicresults")}
            </label>
          </div>
        )}
        {selectedFormat === "Brackets" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="placementSize" className="text-sm font-medium">
              {tBrackets("placementSize")}
            </label>
            <select
              id="placementSize"
              name="placementSize"
              className="rounded-md shadow-xs border border-black p-2 text-sm"
              value={placementSize ?? ""}
              onChange={(e) =>
                setPlacementSize(
                  e.target.value ? Number(e.target.value) : null,
                )
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
        <div>
          <Button disabled={loading} type="submit" variant="primary" fullWidth className="font-semibold">
            {t("submit")}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default NewTournament;
