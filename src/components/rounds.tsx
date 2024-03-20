"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { useTournamentContext } from "@/context/TournamentContext";

function Round() {
  const context = useTournamentContext();

  function toggleRound() {
    if (context.activeRound === 1) {
      context.setActiveRound((prev) => prev + 1);
      return;
    }
    context.setActiveRound(1);
  }
  return (
    <section className="flex gap-3">
      <p>{context.activeRound} kierros</p>
      <button
        onClick={toggleRound}
        className="border-2 border-gray-300 px-3 rounded-md *:h-5 *:w-5"
      >
        {context.activeRound === 1 ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
    </section>
  );
}

export default Round;
