import type { ColumnType } from "kysely";

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Matches {
  match: number;
  player1: string;
  player2: string;
  round: number;
  tournament_id: number;
  winner: string | null;
}

export interface Players {
  player_name: string;
}

export interface TournamentPlayers {
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
