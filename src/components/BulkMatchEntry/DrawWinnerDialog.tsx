"use client";

import Button from "@/components/Button";
import { useTranslations } from "next-intl";
import type { DrawMatch } from "./types";

interface DrawWinnerDialogProps {
  pendingDraw: DrawMatch;
  onSelectWinner: (winnerName: string) => void;
  onCancel: () => void;
}

export function DrawWinnerDialog({
  pendingDraw,
  onSelectWinner,
  onCancel,
}: DrawWinnerDialogProps) {
  const t = useTranslations("BulkEntry");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-center">{t("selectWinner")}</h2>
        <p className="text-center mb-4 text-gray-600">
          {pendingDraw.player1Name} {pendingDraw.hits} - {pendingDraw.hits}{" "}
          {pendingDraw.player2Name}
        </p>
        <div className="flex flex-col gap-3 text-sm font-semibold">
          <Button
            onClick={() => onSelectWinner(pendingDraw.player1Name)}
            variant="primary"
            fullWidth
          >
            {pendingDraw.player1Name}
          </Button>
          <Button
            onClick={() => onSelectWinner(pendingDraw.player2Name)}
            variant="primary"
            fullWidth
          >
            {pendingDraw.player2Name}
          </Button>
          <Button onClick={onCancel} variant="secondary" fullWidth>
            {t("back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
