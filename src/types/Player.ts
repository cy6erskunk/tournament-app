import { Matches, TournamentPlayers } from "@/types/Kysely";

export type Player = {
  player: TournamentPlayers;
  matches: Matches[];
};
