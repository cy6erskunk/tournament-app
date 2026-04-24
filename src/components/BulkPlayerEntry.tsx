"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Button from "./Button";

type Props = {
  tournamentId: number;
  onDone: () => void;
};

export default function BulkPlayerEntry({ tournamentId, onDone }: Props) {
  const t = useTranslations("Select");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ added: string[]; errors: string[] } | null>(null);

  const handleAdd = async () => {
    const names = text
      .split("\n")
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tournament/${tournamentId}/players/bulk`, {
        method: "POST",
        body: JSON.stringify({ names }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setText("");
      } else {
        alert(t("unexpectederror"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="font-bold text-xl">{t("playersStep")}</p>

      {result && (
        <p className="text-sm text-green-700">
          {t("playersAdded", { count: result.added.length })}
          {result.errors.length > 0 && (
            <span className="text-red-600 ml-2">{t("addPlayersFailed")}</span>
          )}
        </p>
      )}

      <textarea
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-32 resize-y"
        placeholder={t("playerNamesPlaceholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />

      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={loading || text.trim().length === 0}
          onClick={handleAdd}
          fullWidth
        >
          {loading ? t("addingPlayers") : t("addPlayersButton")}
        </Button>
        <Button variant="secondary" onClick={onDone} fullWidth>
          {result ? t("done") : t("skipPlayers")}
        </Button>
      </div>
    </div>
  );
}
