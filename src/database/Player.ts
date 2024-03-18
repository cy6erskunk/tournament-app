"use server";
import { Matches, TournamentPlayers } from "./types";

//TODO: Transition to using this cleaner type at some point
// interface Player extends TournamentPlayers {
//   matches: Matches[];
// }

export type Player = {
  player: TournamentPlayers;
  matches: Matches[];
};

