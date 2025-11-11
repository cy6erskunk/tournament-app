import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Matches {
  id: Generated<number>;
  match: number;
  player1: string;
  player1_hits: Generated<number>;
  player2: string;
  player2_hits: Generated<number>;
  round: number;
  tournament_id: number;
  winner: string;
}

export interface Players {
  player_name: string;
}

export interface TournamentPlayers {
  bracket_match: number | null;
  bracket_seed: number | null;
  player_name: string;
  tournament_id: number;
}

export interface Tournaments {
  date: Timestamp;
  format: string;
  id: Generated<number>;
  name: string;
}

export interface Users {
  password: string;
  role: string;
  username: string;
}

export interface DB {
  matches: Matches;
  players: Players;
  tournament_players: TournamentPlayers;
  tournaments: Tournaments;
  users: Users;
}
