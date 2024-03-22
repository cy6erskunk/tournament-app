"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useTournamentContext } from "@/context/TournamentContext";
import { useTranslations } from "next-intl";

function Round() {
  const context = useTournamentContext();
  const t = useTranslations("NewMatch");

  function toggleRound() {
    if (context.activeRound === 1) {
      context.setActiveRound((prev) => prev + 1);
      return;
    }
    context.setActiveRound(1);
  }

  return (
    <section className="flex items-center gap-3 text-base">
      <p>{context.activeRound}. {t("title")}</p>
      <button
        onClick={toggleRound}
        className="disabled:bg-red-300 border-2 border-gray-300 px-3 py-2 rounded-md *:h-5 *:w-5"
      >
        {context.activeRound === 1 ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
    </section>
  );
}

export default Round;
