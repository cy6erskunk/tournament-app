import { TournamentPlayers } from "@/types/Kysely";
import { MatchRow } from "@/types/MatchTypes";

export type Player = {
  player: TournamentPlayers;
  matches: MatchRow[];
};
