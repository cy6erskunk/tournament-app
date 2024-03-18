import { Matches, TournamentPlayers } from "@/database/types"

export type Player = {
  player: TournamentPlayers
  matches: Matches[]
}
