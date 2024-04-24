import { Player } from "@/types/Player";
import { hitIndex } from "./hitIndex";
import winPercentage, { wins } from "./winPercentage";

export type LeaderboardColumns =
  | "percentage"
  | "wins"
  | "name"
  | "index"
  | "given"
  | "taken";

export type SortDirection = "ASC" | "DESC" | "DEFAULT"

export class LeaderboardBuilder {
  private asc: boolean = true;
  private col: LeaderboardColumns = "percentage";
  private p: Player[] = [];

  players(players: Player[]): LeaderboardBuilder {
    this.p = players;
    return this;
  }

  direction(direction: SortDirection): LeaderboardBuilder {
    switch (direction) {
      case "ASC":
        return this.ascending()
      case "DESC":
        return this.descending()
      case "DEFAULT":
        this.column("wins")
        return this
      default:
        return this
    }
  }

  ascending(ascending: boolean = true): LeaderboardBuilder {
    this.asc = ascending;
    return this;
  }

  descending(descending: boolean = true): LeaderboardBuilder {
    return this.ascending(!descending);
  }

  column(column: LeaderboardColumns): LeaderboardBuilder {
    this.col = column;
    return this;
  }

  sort(): Player[] {
    let compareFunction: (a: Player, b: Player) => number;

    if (this.col === "percentage") {
      compareFunction = this.sortPercentage;
    } else if (this.col === "name") {
      compareFunction = this.sortName;
    } else if (this.col === "wins") {
      compareFunction = this.sortWins;
    } else if (this.col === "given") {
      compareFunction = this.sortGiven;
    } else if (this.col === "taken") {
      compareFunction = this.sortTaken;
    } else if (this.col === "index") {
      compareFunction = this.sortIndex;
    }
    this.p.sort((a, b) => {
      let comparison = compareFunction(a, b);
      return this.asc ? comparison : -comparison;
    });

    return this.p;
  }

  private sortPercentage(a: Player, b: Player) {
    if (a.matches.length < 2) return -1;
    if (b.matches.length < 2) return -1;

    // Sort by win percentage
    const winA = winPercentage(a);
    const winB = winPercentage(b);

    if (winA !== winB) {
      return winB - winA;
    }

    // If win percentage is the same, sort by hit index
    const indexA = hitIndex(a);
    const indexB = hitIndex(b);

    return indexB - indexA;
  }

  private sortWins(a: Player, b: Player) {
    if (a.matches.length < 2) return -1;
    if (b.matches.length < 2) return -1;

    // Sort by wins
    const winA = wins(a);
    const winB = wins(b);

    if (winA !== winB) {
      return winB - winA;
    }

    // If win percentage is the same, sort by hit index
    const indexA = hitIndex(a);
    const indexB = hitIndex(b);

    return indexB - indexA;
  }

  private sortGiven(a: Player, b: Player) {
    const aHits = a.matches.reduce((count, match) => {
      const pk = match.player1 === a.player.player_name ? "player1" : "player2";
      return (count += match[`${pk}_hits`]);
    }, 0);

    const bHits = b.matches.reduce((count, match) => {
      const pk = match.player2 === b.player.player_name ? "player2" : "player1";
      return (count += match[`${pk}_hits`]);
    }, 0);

    return bHits - aHits;
  }

  private sortTaken(a: Player, b: Player) {
    const aTaken = a.matches.reduce((count, match) => {
      const pk = match.player1 === a.player.player_name ? "player2" : "player1";
      return (count += match[`${pk}_hits`]);
    }, 0);

    const bTaken = b.matches.reduce((count, match) => {
      const pk = match.player2 === b.player.player_name ? "player1" : "player2";
      return (count += match[`${pk}_hits`]);
    }, 0);

    return bTaken - aTaken;
  }

  private sortIndex(a: Player, b: Player) {
    // If win percentage is the same, sort by hit index
    const indexA = hitIndex(a);
    const indexB = hitIndex(b);

    if (indexA < 0 && indexB < 0) {
      return Math.abs(indexA) - Math.abs(indexB);
    }

    if (indexA < 0) return 1;
    if (indexB < 0) return -1;

    return indexB - indexA;
  }

  private sortName(a: Player, b: Player) {
    const p1 = a.player.player_name;
    const p2 = b.player.player_name;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
    return 0;
  }
}
