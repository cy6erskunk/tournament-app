"use client";

import { useState } from "react";
import { createTournament, type RoundConfig } from "@/database/addTournament";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Button from "./Button";
import RoundBuilder from "./RoundBuilder";
import BulkPlayerEntry from "./BulkPlayerEntry";

type WizardStep = "details" | "players";

const DEFAULT_ROUNDS: RoundConfig[] = [{ type: "pools" }, { type: "pools" }];

function NewTournament() {
  const t = useTranslations("Select");
  const tRound = useTranslations("Round");
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>("details");
  const [createdId, setCreatedId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [rounds, setRounds] = useState<RoundConfig[]>(DEFAULT_ROUNDS);
  const [requireIdentity, setRequireIdentity] = useState(false);
  const [publicResults, setPublicResults] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultName = `${new Date().toLocaleDateString("en-GB")}`;

  const handleCreate = async () => {
    setLoading(true);
    const result = await createTournament(
      new Date(),
      rounds,
      name.trim() || defaultName,
      requireIdentity,
      publicResults,
    );
    setLoading(false);

    if (!result.success) {
      alert(t("createfailed"));
      return;
    }

    setCreatedId(result.value.id);
    setStep("players");
  };

  if (step === "players" && createdId !== null) {
    return (
      <BulkPlayerEntry
        tournamentId={createdId}
        onDone={() => router.push(`/tournament/${createdId}`)}
      />
    );
  }

  return (
    <section className="flex flex-col space-y-5">
      <p className="font-bold text-xl">{t("createtournament")}</p>

      <div className="flex flex-col gap-2">
        <label htmlFor="tournamentName" className="text-sm font-medium">
          {t("tournamentname")}
        </label>
        <input
          id="tournamentName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultName}
          className="rounded-md shadow-xs border border-black p-3"
        />
      </div>

      <div className="flex gap-3 items-center">
        <input
          type="checkbox"
          id="requireIdentity"
          checked={requireIdentity}
          onChange={(e) => setRequireIdentity(e.target.checked)}
          className="rounded-sm"
        />
        <label htmlFor="requireIdentity" className="text-sm">
          {t("requiresubmitteridentity")}
        </label>
      </div>

      <div className="flex gap-3 items-center">
        <input
          type="checkbox"
          id="publicResults"
          checked={publicResults}
          onChange={(e) => setPublicResults(e.target.checked)}
          className="rounded-sm"
        />
        <label htmlFor="publicResults" className="text-sm">
          {t("publicresults")}
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{tRound("rounds")}</p>
        <RoundBuilder rounds={rounds} onChange={setRounds} />
      </div>

      <Button
        disabled={loading}
        onClick={handleCreate}
        variant="primary"
        fullWidth
        className="font-semibold"
      >
        {loading ? "..." : t("next")}
      </Button>
    </section>
  );
}

export default NewTournament;
