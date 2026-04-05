"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useTournamentContext } from "@/context/TournamentContext";
import { useTranslations } from "next-intl";

function Round() {
  const context = useTournamentContext();
  const t = useTranslations("NewMatch");
  const tRound = useTranslations("Round");

  const rounds = context.rounds;
  const currentIdx = rounds.findIndex(
    (r) => r.round_order === context.activeRound,
  );
  const currentRound = rounds[currentIdx];

  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < rounds.length - 1;

  function goToPrev() {
    if (hasPrev) {
      context.setActiveRound(rounds[currentIdx - 1].round_order);
    }
  }

  function goToNext() {
    if (hasNext) {
      context.setActiveRound(rounds[currentIdx + 1].round_order);
    }
  }

  if (rounds.length === 0) {
    return null;
  }

  const roundTypeLabel =
    currentRound?.type === "elimination"
      ? tRound("typeElimination")
      : tRound("typePool");

  return (
    <section className="flex items-center gap-3 text-base">
      {hasPrev && (
        <button
          type="button"
          onClick={goToPrev}
          aria-label={t("previousRound")}
          className="border-2 border-gray-300 px-3 py-2 rounded-md *:h-5 *:w-5"
        >
          <ChevronLeftIcon />
        </button>
      )}
      <p>
        {currentRound ? currentRound.round_order : context.activeRound}.{" "}
        {roundTypeLabel}
      </p>
      {hasNext && (
        <button
          type="button"
          onClick={goToNext}
          aria-label={t("nextRound")}
          className="border-2 border-gray-300 px-3 py-2 rounded-md *:h-5 *:w-5"
        >
          <ChevronRightIcon />
        </button>
      )}
    </section>
  );
}

export default Round;
