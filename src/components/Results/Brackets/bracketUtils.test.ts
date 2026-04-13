import { describe, it, expect } from 'vitest';
import { castToMatch, buildRound, buildRounds } from './bracketUtils';
import type { Player } from '@/types/Player';
import type { MatchRow } from '@/types/MatchTypes';

const makePlayer = (name: string, tournamentId = 1): Player => ({
  player: {
    player_name: name,
    tournament_id: tournamentId,
    bracket_match: null,
    bracket_seed: null,
    pool_id: null,
  },
  matches: [],
});

const makeMatchRow = (
  overrides: Partial<MatchRow> & { player1: string; player2: string },
): MatchRow => ({
  id: 1,
  match: 1,
  player1_hits: 5,
  player2_hits: 3,
  winner: overrides.player1,
  tournament_id: 1,
  round: 1,
  round_id: null,
  submitted_by_token: null,
  submitted_at: null,
  ...overrides,
});

describe('castToMatch', () => {
  it('resolves player1 and player2 names to Player objects', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    const row = makeMatchRow({ player1: 'Alice', player2: 'Bob' });

    const match = castToMatch(row, [alice, bob]);

    expect(match.player1).toBe(alice);
    expect(match.player2).toBe(bob);
  });

  it('sets player1 to null when name not found', () => {
    const alice = makePlayer('Alice');
    const row = makeMatchRow({ player1: 'Unknown', player2: 'Alice' });

    const match = castToMatch(row, [alice]);

    expect(match.player1).toBeNull();
    expect(match.player2).toBe(alice);
  });

  it('preserves match statistics', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    const row = makeMatchRow({
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 7,
      player2_hits: 4,
      winner: 'Alice',
      round: 2,
      tournament_id: 5,
    });

    const match = castToMatch(row, [alice, bob]);

    expect(match.player1_hits).toBe(7);
    expect(match.player2_hits).toBe(4);
    expect(match.winner).toBe('Alice');
    expect(match.round).toBe(2);
    expect(match.tournament_id).toBe(5);
  });

  it('does not include the database id field', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    const row = makeMatchRow({ id: 99, player1: 'Alice', player2: 'Bob' });

    const match = castToMatch(row, [alice, bob]);

    expect((match as Record<string, unknown>)['id']).toBeUndefined();
  });
});

describe('buildRound', () => {
  it('returns undefined when tournamentId is 0', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    const pairs = [
      [{ player: alice, futurePlayer: true }, { player: bob, futurePlayer: true }],
    ] as Parameters<typeof buildRound>[2];

    expect(buildRound(1, 0, pairs, [alice, bob])).toBeUndefined();
  });

  it('creates a placeholder match for pairs without a shared match', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    const pairs = [
      [{ player: alice, futurePlayer: true }, { player: bob, futurePlayer: true }],
    ] as Parameters<typeof buildRound>[2];

    const round = buildRound(1, 1, pairs, [alice, bob]);

    expect(round).toBeDefined();
    expect(round!.matches).toHaveLength(1);
    expect(round!.matches[0].player1).toBe(alice);
    expect(round!.matches[0].player2).toBe(bob);
    expect(round!.matches[0].winner).toBe('');
  });

  it('uses existing match data when players share a match', () => {
    const matchRow = makeMatchRow({
      id: 10,
      match: 1,
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 5,
      player2_hits: 3,
      winner: 'Alice',
      round: 1,
    });
    const alice = { ...makePlayer('Alice'), matches: [matchRow] };
    const bob = { ...makePlayer('Bob'), matches: [matchRow] };

    const pairs = [
      [{ player: alice, futurePlayer: true }, { player: bob, futurePlayer: true }],
    ] as Parameters<typeof buildRound>[2];

    const round = buildRound(1, 1, pairs, [alice, bob]);

    expect(round!.matches[0].player1).toBe(alice);
    expect(round!.matches[0].player1_hits).toBe(5);
    expect(round!.matches[0].winner).toBe('Alice');
  });

  it('sorts matches by match number', () => {
    const matchRow1 = makeMatchRow({
      id: 1, match: 2, player1: 'Alice', player2: 'Bob', round: 1,
    });
    const matchRow2 = makeMatchRow({
      id: 2, match: 1, player1: 'Charlie', player2: 'Dave', round: 1,
    });
    const alice = { ...makePlayer('Alice'), matches: [matchRow1] };
    const bob = { ...makePlayer('Bob'), matches: [matchRow1] };
    const charlie = { ...makePlayer('Charlie'), matches: [matchRow2] };
    const dave = { ...makePlayer('Dave'), matches: [matchRow2] };

    const pairs = [
      [{ player: charlie, futurePlayer: true }, { player: dave, futurePlayer: true }],
      [{ player: alice, futurePlayer: true }, { player: bob, futurePlayer: true }],
    ] as Parameters<typeof buildRound>[2];

    const round = buildRound(1, 1, pairs, [alice, bob, charlie, dave]);

    expect(round!.matches[0].match).toBe(1);
    expect(round!.matches[1].match).toBe(2);
  });
});

describe('buildRounds', () => {
  it('returns empty array when fewer than 2 players', () => {
    expect(buildRounds({ capacity: undefined, tournamentId: 1, players: [], allPlayers: [] })).toEqual([]);
    const alice = makePlayer('Alice');
    expect(buildRounds({ capacity: undefined, tournamentId: 1, players: [alice], allPlayers: [alice] })).toEqual([]);
  });

  it('builds 1 round for 2 players', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    const rounds = buildRounds({
      capacity: undefined,
      tournamentId: 1,
      players: [alice, bob],
      allPlayers: [alice, bob],
    });

    expect(rounds).toHaveLength(1);
    expect(rounds[0].matches).toHaveLength(1);
    expect(rounds[0].matches[0].player1).toBe(alice);
    expect(rounds[0].matches[0].player2).toBe(bob);
  });

  it('builds 2 rounds for 4 players', () => {
    const players = ['Alice', 'Bob', 'Charlie', 'Dave'].map(makePlayer);
    const rounds = buildRounds({
      capacity: undefined,
      tournamentId: 1,
      players,
      allPlayers: players,
    });

    expect(rounds).toHaveLength(2);
    expect(rounds[0].matches).toHaveLength(2);
    expect(rounds[1].matches).toHaveLength(1);
  });

  it('builds 3 rounds for 8 players', () => {
    const players = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(makePlayer);
    const rounds = buildRounds({
      capacity: undefined,
      tournamentId: 1,
      players,
      allPlayers: players,
    });

    expect(rounds).toHaveLength(3);
    expect(rounds[0].matches).toHaveLength(4);
    expect(rounds[1].matches).toHaveLength(2);
    expect(rounds[2].matches).toHaveLength(1);
  });

  it('handles odd number of players (3 players → 2 rounds)', () => {
    const players = ['Alice', 'Bob', 'Charlie'].map(makePlayer);
    const rounds = buildRounds({
      capacity: undefined,
      tournamentId: 1,
      players,
      allPlayers: players,
    });

    // ceil(log2(3)) = 2 rounds
    expect(rounds).toHaveLength(2);
  });

  it('advances winner to next round after first-round match played', () => {
    const matchRow = makeMatchRow({
      id: 1, match: 1, player1: 'Alice', player2: 'Bob',
      player1_hits: 5, player2_hits: 3, winner: 'Alice', round: 1,
    });
    const alice = { ...makePlayer('Alice'), matches: [matchRow] };
    const bob = { ...makePlayer('Bob'), matches: [matchRow] };
    const charlie = makePlayer('Charlie');
    const dave = makePlayer('Dave');
    const players = [alice, bob, charlie, dave];

    const rounds = buildRounds({
      capacity: undefined,
      tournamentId: 1,
      players,
      allPlayers: players,
    });

    // Round 2, match 1 should have Alice advancing
    const semifinal = rounds[1].matches[0];
    expect(semifinal.player1).toBe(alice);
  });

  it('does not advance any player when round match has no winner yet', () => {
    const alice = makePlayer('Alice');
    const bob = makePlayer('Bob');
    const charlie = makePlayer('Charlie');
    const dave = makePlayer('Dave');
    const players = [alice, bob, charlie, dave];

    const rounds = buildRounds({
      capacity: undefined,
      tournamentId: 1,
      players,
      allPlayers: players,
    });

    // No matches played, so round 2 should have null players
    const final = rounds[1].matches[0];
    expect(final.player1).toBeNull();
    expect(final.player2).toBeNull();
  });

  it('assigns correct round ids', () => {
    const players = ['Alice', 'Bob', 'Charlie', 'Dave'].map(makePlayer);
    const rounds = buildRounds({
      capacity: undefined,
      tournamentId: 1,
      players,
      allPlayers: players,
    });

    expect(rounds[0].id).toBe(1);
    expect(rounds[1].id).toBe(2);
  });
});
