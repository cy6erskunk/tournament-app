import { describe, it, expect } from "vitest";
import { LeaderboardBuilder } from "./leaderboardSort";
import { Player } from "@/types/Player";

// Helper to create a mock TournamentPlayers record
function makeTournamentPlayer(
  playerName: string,
  tournamentId: number = 1,
  poolId: number | null = null,
) {
  return {
    player_name: playerName,
    tournament_id: tournamentId,
    bracket_match: null,
    bracket_seed: null,
    pool_id: poolId,
  };
}

// Helper to create a mock MatchRow
function makeMatch(
  player1: string,
  player2: string,
  player1Hits: number,
  player2Hits: number,
  tournamentId: number = 1,
  round: number = 1,
  matchId: number = 1,
) {
  const winner = player1Hits > player2Hits ? player1 : player2;
  return {
    id: matchId,
    match: matchId,
    player1,
    player2,
    player1_hits: player1Hits,
    player2_hits: player2Hits,
    winner,
    tournament_id: tournamentId,
    round,
    submitted_by_token: null,
    submitted_at: null,
  };
}

// Helper to create a Player with matches
function makePlayer(
  name: string,
  matches: ReturnType<typeof makeMatch>[],
  poolId: number | null = null,
): Player {
  return {
    player: makeTournamentPlayer(name, 1, poolId),
    matches,
  };
}

describe("LeaderboardBuilder - shared ranking across pools", () => {
  it("should rank players from multiple pools in a single shared leaderboard", () => {
    // Pool A players
    const matchA1 = makeMatch("Alice", "Bob", 5, 2, 1, 1, 1); // Alice wins
    const matchA2 = makeMatch("Alice", "Carol", 5, 1, 1, 1, 2); // Alice wins
    const matchA3 = makeMatch("Bob", "Carol", 3, 5, 1, 1, 3); // Carol wins

    const alice = makePlayer("Alice", [matchA1, matchA2], 1);
    const bob = makePlayer("Bob", [matchA1, matchA3], 1);
    const carol = makePlayer("Carol", [matchA2, matchA3], 1);

    // Pool B players
    const matchB1 = makeMatch("Dave", "Eve", 5, 2, 1, 1, 4); // Dave wins
    const matchB2 = makeMatch("Dave", "Frank", 5, 3, 1, 1, 5); // Dave wins
    const matchB3 = makeMatch("Eve", "Frank", 3, 5, 1, 1, 6); // Frank wins

    const dave = makePlayer("Dave", [matchB1, matchB2], 2);
    const eve = makePlayer("Eve", [matchB1, matchB3], 2);
    const frank = makePlayer("Frank", [matchB2, matchB3], 2);

    const allPlayers = [alice, bob, carol, dave, eve, frank];

    const sorted = new LeaderboardBuilder().players(allPlayers).round(0).sort();

    // Alice and Dave both have 100% win rate - ranked first
    expect(sorted[0].player.player_name).toSatisfy(
      (name: string) => name === "Alice" || name === "Dave",
    );
    expect(sorted[1].player.player_name).toSatisfy(
      (name: string) => name === "Alice" || name === "Dave",
    );

    // Carol and Frank both won 1/2 - ranked 3rd/4th
    expect(sorted[2].player.player_name).toSatisfy(
      (name: string) => name === "Carol" || name === "Frank",
    );
    expect(sorted[3].player.player_name).toSatisfy(
      (name: string) => name === "Carol" || name === "Frank",
    );

    // Bob and Eve both lost 2/2 - ranked last
    expect(sorted[4].player.player_name).toSatisfy(
      (name: string) => name === "Bob" || name === "Eve",
    );
    expect(sorted[5].player.player_name).toSatisfy(
      (name: string) => name === "Bob" || name === "Eve",
    );
  });

  it("should use hit index as tiebreaker for players from different pools with same win percentage", () => {
    // Pool A: Alice wins 2/2 with big margins
    const matchA1 = makeMatch("Alice", "Bob", 5, 0, 1, 1, 1);
    const matchA2 = makeMatch("Alice", "Carol", 5, 0, 1, 1, 2);
    const matchA3 = makeMatch("Bob", "Carol", 3, 5, 1, 1, 3);
    const alice = makePlayer("Alice", [matchA1, matchA2], 1);
    const bob = makePlayer("Bob", [matchA1, matchA3], 1);
    const carol = makePlayer("Carol", [matchA2, matchA3], 1);

    // Pool B: Dave wins 2/2 with narrow margins
    const matchB1 = makeMatch("Dave", "Eve", 5, 4, 1, 1, 4);
    const matchB2 = makeMatch("Dave", "Frank", 5, 4, 1, 1, 5);
    const matchB3 = makeMatch("Eve", "Frank", 3, 5, 1, 1, 6);
    const dave = makePlayer("Dave", [matchB1, matchB2], 2);
    const eve = makePlayer("Eve", [matchB1, matchB3], 2);
    const frank = makePlayer("Frank", [matchB2, matchB3], 2);

    const allPlayers = [dave, alice, bob, carol, eve, frank];

    const sorted = new LeaderboardBuilder()
      .players(allPlayers)
      .column("percentage")
      .sort();

    // Alice has better hit index (+10) than Dave (+2), so Alice ranks higher
    expect(sorted[0].player.player_name).toBe("Alice");
    expect(sorted[1].player.player_name).toBe("Dave");
  });

  it("should treat pool_id as irrelevant for ranking - only match results matter", () => {
    // All players in same tournament, different pools
    const match1 = makeMatch("Alpha", "Beta", 5, 1, 1, 1, 1);
    const match2 = makeMatch("Alpha", "Gamma", 5, 2, 1, 1, 2);
    const match3 = makeMatch("Beta", "Gamma", 3, 1, 1, 1, 3);

    const alpha = makePlayer("Alpha", [match1, match2], 1);
    const beta = makePlayer("Beta", [match1, match3], 1);
    const gamma = makePlayer("Gamma", [match2, match3], 2); // different pool

    const sorted = new LeaderboardBuilder()
      .players([alpha, beta, gamma])
      .sort();

    // Alpha: 2 wins, 100%
    expect(sorted[0].player.player_name).toBe("Alpha");
    // Beta: 1 win (beat Gamma), 50%
    expect(sorted[1].player.player_name).toBe("Beta");
    // Gamma: 0 wins, 0%
    expect(sorted[2].player.player_name).toBe("Gamma");
  });

  it("should sort by wins correctly across pools", () => {
    const match1 = makeMatch("P1", "P2", 5, 2, 1, 1, 1);
    const match2 = makeMatch("P1", "P3", 5, 3, 1, 1, 2);
    const match3 = makeMatch("P1", "P4", 5, 4, 1, 1, 3);
    const match4 = makeMatch("P2", "P3", 4, 5, 1, 1, 4);
    const match5 = makeMatch("P2", "P4", 3, 5, 1, 1, 5);
    const match6 = makeMatch("P3", "P4", 2, 5, 1, 1, 6);

    const p1 = makePlayer("P1", [match1, match2, match3], 1); // 3 wins - Pool A
    const p2 = makePlayer("P2", [match1, match4, match5], 1); // 0 wins - Pool A
    const p3 = makePlayer("P3", [match2, match4, match6], 2); // 1 win - Pool B
    const p4 = makePlayer("P4", [match3, match5, match6], 2); // 2 wins - Pool B

    const sorted = new LeaderboardBuilder()
      .players([p2, p4, p1, p3])
      .column("wins")
      .sort();

    expect(sorted[0].player.player_name).toBe("P1"); // 3 wins
    expect(sorted[1].player.player_name).toBe("P4"); // 2 wins
    expect(sorted[2].player.player_name).toBe("P3"); // 1 win
    expect(sorted[3].player.player_name).toBe("P2"); // 0 wins
  });

  it("should handle players with no pool assignment in same ranking", () => {
    const match1 = makeMatch("Unassigned", "Pooled", 5, 2, 1, 1, 1);
    const match2 = makeMatch("Unassigned", "Other", 5, 3, 1, 1, 2);
    const match3 = makeMatch("Pooled", "Other", 4, 1, 1, 1, 3);

    const unassigned = makePlayer("Unassigned", [match1, match2], null); // no pool
    const pooled = makePlayer("Pooled", [match1, match3], 1); // in pool
    const other = makePlayer("Other", [match2, match3], 1); // in pool

    const sorted = new LeaderboardBuilder()
      .players([pooled, unassigned, other])
      .sort();

    // Unassigned: 2 wins, 100%
    expect(sorted[0].player.player_name).toBe("Unassigned");
    // Pooled: 1 win, 50%
    expect(sorted[1].player.player_name).toBe("Pooled");
    // Other: 0 wins, 0%
    expect(sorted[2].player.player_name).toBe("Other");
  });

  it("should rank players with fewer than 2 matches last regardless of pool", () => {
    const match1 = makeMatch("Active1", "Active2", 5, 2, 1, 1, 1);
    const match2 = makeMatch("Active1", "Active3", 5, 3, 1, 1, 2);
    const match3 = makeMatch("Active2", "Active3", 3, 5, 1, 1, 3);

    const active1 = makePlayer("Active1", [match1, match2], 1); // 2 wins in Pool A
    const active2 = makePlayer("Active2", [match1, match3], 1); // 0 wins in Pool A
    const active3 = makePlayer("Active3", [match2, match3], 2); // 1 win in Pool B
    const newbie = makePlayer("Newbie", [], 2); // 0 matches in Pool B

    const sorted = new LeaderboardBuilder()
      .players([newbie, active2, active3, active1])
      .column("percentage")
      .sort();

    // Newbie should be last (fewer than 2 matches)
    expect(sorted[3].player.player_name).toBe("Newbie");
  });

  it("should sort by hit index across pools", () => {
    const match1 = makeMatch("High", "Low", 5, 0, 1, 1, 1); // High +5, Low -5
    const match2 = makeMatch("High", "Mid", 5, 2, 1, 1, 2); // High +3, Mid -3
    const match3 = makeMatch("Low", "Mid", 2, 3, 1, 1, 3); // Low -1, Mid +1

    // High is in Pool A, Mid and Low are in Pool B
    const high = makePlayer("High", [match1, match2], 1);
    const mid = makePlayer("Mid", [match2, match3], 2);
    const low = makePlayer("Low", [match1, match3], 2);

    const sorted = new LeaderboardBuilder()
      .players([low, mid, high])
      .column("index")
      .sort();

    expect(sorted[0].player.player_name).toBe("High"); // +8
    expect(sorted[1].player.player_name).toBe("Mid"); // -2
    expect(sorted[2].player.player_name).toBe("Low"); // -6
  });
});

describe("LeaderboardBuilder - round filtering with pools", () => {
  it("should filter by round for multi-pool tournaments", () => {
    // Pool A: Alice, Bob, Carol each play 2 matches per round
    const r1m1 = makeMatch("Alice", "Bob", 5, 2, 1, 1, 1); // Alice wins round 1
    const r1m2 = makeMatch("Alice", "Carol", 5, 1, 1, 1, 2); // Alice wins round 1
    const r1m3 = makeMatch("Bob", "Carol", 3, 5, 1, 1, 3); // Carol wins round 1

    const r2m1 = makeMatch("Alice", "Bob", 2, 5, 1, 2, 4); // Bob wins round 2
    const r2m2 = makeMatch("Alice", "Carol", 1, 5, 1, 2, 5); // Carol wins round 2
    const r2m3 = makeMatch("Bob", "Carol", 5, 3, 1, 2, 6); // Bob wins round 2

    const alice = makePlayer("Alice", [r1m1, r1m2, r2m1, r2m2], 1);
    const bob = makePlayer("Bob", [r1m1, r1m3, r2m1, r2m3], 1);
    const carol = makePlayer("Carol", [r1m2, r1m3, r2m2, r2m3], 1);

    // Pool B: Dave, Eve, Frank each play 2 matches per round
    const r1m4 = makeMatch("Dave", "Eve", 5, 1, 1, 1, 7); // Dave wins round 1
    const r1m5 = makeMatch("Dave", "Frank", 5, 2, 1, 1, 8); // Dave wins round 1
    const r1m6 = makeMatch("Eve", "Frank", 3, 5, 1, 1, 9); // Frank wins round 1

    const r2m4 = makeMatch("Dave", "Eve", 1, 5, 1, 2, 10); // Eve wins round 2
    const r2m5 = makeMatch("Dave", "Frank", 2, 5, 1, 2, 11); // Frank wins round 2
    const r2m6 = makeMatch("Eve", "Frank", 5, 3, 1, 2, 12); // Eve wins round 2

    const dave = makePlayer("Dave", [r1m4, r1m5, r2m4, r2m5], 2);
    const eve = makePlayer("Eve", [r1m4, r1m6, r2m4, r2m6], 2);
    const frank = makePlayer("Frank", [r1m5, r1m6, r2m5, r2m6], 2);

    // Filter to round 1: Alice and Dave won 100%, Carol and Frank won 50%
    const round1Sorted = new LeaderboardBuilder()
      .players([alice, bob, carol, dave, eve, frank])
      .round(1)
      .sort();

    expect(round1Sorted[0].player.player_name).toSatisfy(
      (name: string) => name === "Alice" || name === "Dave",
    );
    expect(round1Sorted[1].player.player_name).toSatisfy(
      (name: string) => name === "Alice" || name === "Dave",
    );

    // Filter to round 2: Bob and Eve won 100%
    const round2Sorted = new LeaderboardBuilder()
      .players([alice, bob, carol, dave, eve, frank])
      .round(2)
      .sort();

    expect(round2Sorted[0].player.player_name).toSatisfy(
      (name: string) => name === "Bob" || name === "Eve",
    );
    expect(round2Sorted[1].player.player_name).toSatisfy(
      (name: string) => name === "Bob" || name === "Eve",
    );
  });
});
