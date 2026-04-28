"use client";

import { useTranslations } from "next-intl";
import type { RoundConfig } from "@/database/addTournament";
import Button from "./Button";

const PRESETS: { key: string; rounds: RoundConfig[] }[] = [
  { key: "presetPools", rounds: [{ type: "pools" }] },
  { key: "presetDoublePools", rounds: [{ type: "pools" }, { type: "pools" }] },
  { key: "presetElimination", rounds: [{ type: "elimination" }] },
  { key: "presetPoolsElim", rounds: [{ type: "pools" }, { type: "elimination" }] },
  {
    key: "presetDoublePoolsElim",
    rounds: [{ type: "pools" }, { type: "pools" }, { type: "elimination" }],
  },
];

type Props = {
  rounds: RoundConfig[];
  onChange: (rounds: RoundConfig[]) => void;
};

export default function RoundBuilder({ rounds, onChange }: Props) {
  const t = useTranslations("Round");

  const removeRound = (index: number) =>
    onChange(rounds.filter((_, i) => i !== index));

  const addRound = (type: RoundConfig["type"]) =>
    onChange([...rounds, { type }]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.rounds)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
          >
            {t(preset.key as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-1">
        {rounds.map((round, i) => (
          <li key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-1.5 text-sm">
            <span>
              {i + 1}. {round.type === "pools" ? t("typePool") : t("typeElimination")}
            </span>
            {rounds.length > 1 && (
              <button
                type="button"
                onClick={() => removeRound(i)}
                className="text-slate-400 hover:text-red-500 text-xs"
              >
                {t("deleteRound")}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => addRound("pools")}>
          + {t("addPoolRound")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => addRound("elimination")}>
          + {t("addEliminationRound")}
        </Button>
      </div>
    </div>
  );
}
