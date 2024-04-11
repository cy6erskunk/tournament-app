"use client";

import { useTournamentContext } from "@/context/TournamentContext";

export function TournamentTitle() {
  const context = useTournamentContext();

  return (
      <span className={context.loading ? "invisible" : ""}>
        {context.loading ? "" : context.tournament?.name}
      </span>
  );
}
