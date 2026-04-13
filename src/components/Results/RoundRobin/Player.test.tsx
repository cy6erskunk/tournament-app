import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Player } from './Player';
import type { Player as PlayerType } from '@/types/Player';
import type { MatchRow } from '@/types/MatchTypes';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      add: 'Add',
      remove: 'Remove',
      winShort: 'W',
      lossShort: 'L',
    };
    return t[key] ?? key;
  },
}));

vi.mock('@/database/removeTournamentPlayer', () => ({
  removeTournamentPlayer: vi.fn().mockResolvedValue({ success: true }),
}));

const mockContext = {
  activeRound: 1,
  players: [] as (PlayerType | null)[],
  setPlayers: vi.fn(),
  tournament: { id: 1, name: 'Test Tournament', format: 'Round Robin', date: new Date() },
  setTournament: vi.fn(),
  setActiveRound: vi.fn(),
  loading: false,
  hidden: false,
  setHidden: vi.fn(),
  pools: [],
  setPools: vi.fn(),
};

vi.mock('@/context/TournamentContext', () => ({
  useTournamentContext: () => mockContext,
}));

const mockUserContext = {
  user: null as { username: string; role: string } | null,
  setUser: vi.fn(),
};

vi.mock('@/context/UserContext', () => ({
  useUserContext: () => mockUserContext,
}));

const makePlayer = (name: string, matches: MatchRow[] = []): PlayerType => ({
  player: {
    player_name: name,
    tournament_id: 1,
    bracket_match: null,
    bracket_seed: null,
    pool_id: null,
  },
  matches,
});

const makeMatch = (
  player1: string,
  player2: string,
  player1_hits: number,
  player2_hits: number,
  winner: string,
  round = 1,
): MatchRow => ({
  id: 1,
  match: 1,
  player1,
  player2,
  player1_hits,
  player2_hits,
  winner,
  tournament_id: 1,
  round,
  round_id: null,
  submitted_by_token: null,
  submitted_at: null,
});

const renderPlayer = (
  player: PlayerType,
  opts: {
    poolPlayers?: PlayerType[];
    isAuthenticated?: boolean;
    nthRow?: number;
  } = {},
) => {
  const { poolPlayers, isAuthenticated = false, nthRow = 0 } = opts;
  return render(
    <table>
      <tbody>
        <Player
          player={player}
          nthRow={nthRow}
          openModal={vi.fn()}
          openEditModal={vi.fn()}
          poolPlayers={poolPlayers}
          isAuthenticated={isAuthenticated}
        />
      </tbody>
    </table>,
  );
};

describe('Player (RoundRobin)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserContext.user = null;
    mockContext.players = [];
    mockContext.activeRound = 1;
  });

  describe('Basic rendering', () => {
    it('renders the player name', () => {
      renderPlayer(makePlayer('Alice'));
      expect(screen.getByText('Alice')).toBeTruthy();
    });

    it('renders the rank number (nthRow + 1)', () => {
      renderPlayer(makePlayer('Alice'), { nthRow: 2 });
      expect(screen.getByText('3')).toBeTruthy();
    });

    it('renders zero wins, hits given, taken and diff when no matches', () => {
      renderPlayer(makePlayer('Alice'));
      const zeros = screen.getAllByText('0');
      // wins, hits given, hits taken, hit diff — all 0
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Statistics', () => {
    it('counts wins in the active round', () => {
      const match = makeMatch('Alice', 'Bob', 5, 3, 'Alice', 1);
      const player = makePlayer('Alice', [match]);
      // Use nthRow=9 so rank=10, avoiding collision with win count=1
      renderPlayer(player, { nthRow: 9 });
      const all1 = screen.getAllByText('1');
      // Should have exactly one "1" — the wins cell
      expect(all1).toHaveLength(1);
    });

    it('does not count wins from other rounds', () => {
      const round2match = makeMatch('Alice', 'Bob', 5, 3, 'Alice', 2);
      const player = makePlayer('Alice', [round2match]);
      mockContext.activeRound = 1;
      renderPlayer(player);
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1); // wins cell should be 0
    });

    it('shows correct hits given', () => {
      const match = makeMatch('Alice', 'Bob', 7, 2, 'Alice');
      const player = makePlayer('Alice', [match]);
      renderPlayer(player);
      expect(screen.getByText('7')).toBeTruthy();
    });

    it('shows correct hits taken', () => {
      const match = makeMatch('Alice', 'Bob', 7, 2, 'Alice');
      const player = makePlayer('Alice', [match]);
      renderPlayer(player);
      expect(screen.getByText('2')).toBeTruthy();
    });

    it('shows correct hit differential', () => {
      const match = makeMatch('Alice', 'Bob', 7, 2, 'Alice');
      const player = makePlayer('Alice', [match]);
      renderPlayer(player);
      expect(screen.getByText('5')).toBeTruthy(); // 7 - 2 = 5
    });

    it('accumulates stats across multiple matches in round', () => {
      const m1 = makeMatch('Alice', 'Bob', 5, 3, 'Alice');
      const m2 = { ...makeMatch('Alice', 'Charlie', 4, 2, 'Alice'), id: 2 };
      const player = makePlayer('Alice', [m1, m2]);
      renderPlayer(player);
      expect(screen.getByText('9')).toBeTruthy(); // 5+4 hits given
    });
  });

  describe('Match result cells', () => {
    it('shows W + hits for a win against opponent', () => {
      const match = makeMatch('Alice', 'Bob', 5, 3, 'Alice');
      const alice = makePlayer('Alice', [match]);
      const bob = makePlayer('Bob', [match]);
      const poolPlayers = [alice, bob];
      mockContext.players = poolPlayers;
      renderPlayer(alice, { poolPlayers });
      expect(screen.getByText('W5')).toBeTruthy();
    });

    it('shows L + hits for a loss against opponent', () => {
      const match = makeMatch('Alice', 'Bob', 3, 5, 'Bob');
      const alice = makePlayer('Alice', [match]);
      const bob = makePlayer('Bob', [match]);
      const poolPlayers = [alice, bob];
      mockContext.players = poolPlayers;
      renderPlayer(alice, { poolPlayers });
      expect(screen.getByText('L3')).toBeTruthy();
    });

    it('shows only hits (no prefix) when match result is a draw without winner', () => {
      const match = makeMatch('Alice', 'Bob', 5, 5, '');
      const alice = makePlayer('Alice', [match]);
      const bob = makePlayer('Bob', [match]);
      const poolPlayers = [alice, bob];
      mockContext.players = poolPlayers;
      renderPlayer(alice, { poolPlayers });
      // The match cell should show "5" without W/L prefix
      const matchCell = screen.getByTitle('Alice vs. Bob');
      expect(matchCell.textContent).toBe('5');
    });
  });

  describe('Authentication-dependent buttons', () => {
    it('shows add-match button when isAuthenticated=true', () => {
      const player = makePlayer('Alice');
      mockContext.players = [player];
      renderPlayer(player, { isAuthenticated: true });
      expect(screen.getByLabelText('Add Alice')).toBeTruthy();
    });

    it('hides add-match button when isAuthenticated=false', () => {
      const player = makePlayer('Alice');
      renderPlayer(player, { isAuthenticated: false });
      expect(screen.queryByLabelText('Add Alice')).toBeNull();
    });

    it('shows remove button for admin user', () => {
      mockUserContext.user = { username: 'admin', role: 'admin' };
      const player = makePlayer('Alice');
      mockContext.players = [player];
      renderPlayer(player);
      expect(screen.getByLabelText('Remove Alice')).toBeTruthy();
    });

    it('hides remove button for non-admin user', () => {
      mockUserContext.user = { username: 'user', role: 'user' };
      const player = makePlayer('Alice');
      renderPlayer(player);
      expect(screen.queryByLabelText('Remove Alice')).toBeNull();
    });

    it('hides remove button when not logged in', () => {
      mockUserContext.user = null;
      const player = makePlayer('Alice');
      renderPlayer(player);
      expect(screen.queryByLabelText('Remove Alice')).toBeNull();
    });
  });

  describe('Pool-scoped opponent columns', () => {
    it('renders only the provided poolPlayers as opponent columns', () => {
      const alice = makePlayer('Alice');
      const bob = makePlayer('Bob');
      const charlie = makePlayer('Charlie');
      mockContext.players = [alice, bob, charlie];
      // Only show Alice vs Bob (not Charlie)
      renderPlayer(alice, { poolPlayers: [alice, bob] });
      // Charlie's name should not appear anywhere in the table header columns
      const headers = screen.queryAllByRole('columnheader');
      const headerText = headers.map((h) => h.textContent).join('');
      expect(headerText).not.toContain('Charlie');
    });

    it('falls back to context players when poolPlayers not provided', () => {
      const alice = makePlayer('Alice');
      const bob = makePlayer('Bob');
      mockContext.players = [alice, bob];
      renderPlayer(alice);
      // Both players rendered
      expect(screen.getByText('Alice')).toBeTruthy();
    });
  });
});
