import { Matches, TournamentPlayers } from "@/types/Kysely";
import NormalizedId from "@/types/NormalizedId";

export type Player = {
  player: TournamentPlayers;
  matches: NormalizedId<Matches>[];
};
