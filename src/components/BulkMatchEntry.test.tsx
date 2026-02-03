import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BulkMatchEntry from './BulkMatchEntry';
import { Player } from '@/types/Player';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: { count?: number }) => {
    const translations: Record<string, string> = {
      'title': 'DT Results Entry',
      'round': 'Round',
      'instructions': 'Enter results row by row. Press Enter to move to the next cell.',
      'player': 'Player',
      'submit': 'Submit Results',
      'submitting': 'Submitting...',
      'back': 'Back',
      'unauthorized': 'Unauthorized',
      'noMatchesToSubmit': 'No matches to submit',
      'matchExists': 'Match already exists',
      'submitFailed': 'Submit failed',
      'networkError': 'Network error',
      'submitted': `${params?.count} matches submitted`,
      'pendingMatches': `${params?.count} matches pending`,
      'selectWinner': 'Select winner',
      'winner': 'Winner',
      'unresolvedDraws': `${params?.count} draw(s) need resolution`,
    };
    return translations[key] || key;
  },
}));

// Mock players
const createMockPlayer = (name: string, matches: Player['matches'] = []): Player => ({
  player: {
    player_name: name,
    tournament_id: 1,
    bracket_match: null,
    bracket_seed: null,
  },
  matches,
});

// Mock TournamentContext
const mockSetPlayers = vi.fn();
const mockTournamentContext = {
  tournament: { id: 1, name: 'Test Tournament', format: 'Round Robin', date: new Date() },
  setTournament: vi.fn(),
  players: [] as (Player | null)[],
  setPlayers: mockSetPlayers,
  activeRound: 1,
  setActiveRound: vi.fn(),
  loading: false,
  hidden: false,
  setHidden: vi.fn(),
};

vi.mock('@/context/TournamentContext', () => ({
  useTournamentContext: () => mockTournamentContext,
}));

// Mock UserContext
const mockUserContext = {
  user: { username: 'admin', role: 'admin' },
  setUser: vi.fn(),
};

vi.mock('@/context/UserContext', () => ({
  useUserContext: () => mockUserContext,
}));

describe('BulkMatchEntry', () => {
  const mockCloseModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTournamentContext.players = [
      createMockPlayer('Alice'),
      createMockPlayer('Bob'),
      createMockPlayer('Charlie'),
    ];
    mockUserContext.user = { username: 'admin', role: 'admin' };
    global.fetch = vi.fn();
  });

  describe('Access Control', () => {
    it('should show unauthorized message for non-admin users', () => {
      mockUserContext.user = { username: 'user', role: 'user' };

      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      expect(screen.getByText('Unauthorized')).toBeTruthy();
      expect(screen.queryByText('DT Results Entry')).toBeNull();
    });

    it('should render the table for admin users', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      expect(screen.getByText('DT Results Entry - Round 1')).toBeTruthy();
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
      expect(screen.getByText('Charlie')).toBeTruthy();
    });
  });

  describe('Table Rendering', () => {
    it('should render player names with indices', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      expect(screen.getByText('1.')).toBeTruthy();
      expect(screen.getByText('2.')).toBeTruthy();
      expect(screen.getByText('3.')).toBeTruthy();
    });

    it('should render column headers with numbers', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(4); // Player column + 3 opponent columns
      expect(headers[1].textContent).toBe('1');
      expect(headers[2].textContent).toBe('2');
      expect(headers[3].textContent).toBe('3');
    });

    it('should render input cells for non-diagonal positions', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      // 3 players = 3 rows × 2 non-diagonal cells = 6 input cells
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(6);
    });
  });

  describe('Cell Input', () => {
    it('should update cell value on input', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '5' } });

      expect((inputs[0] as HTMLInputElement).value).toBe('5');
    });

    it('should reject invalid values', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Try negative value
      fireEvent.change(inputs[0], { target: { value: '-1' } });
      expect((inputs[0] as HTMLInputElement).value).toBe('');

      // Try value > 99
      fireEvent.change(inputs[0], { target: { value: '100' } });
      expect((inputs[0] as HTMLInputElement).value).toBe('');
    });

    it('should allow values 0-99', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      fireEvent.change(inputs[0], { target: { value: '0' } });
      expect((inputs[0] as HTMLInputElement).value).toBe('0');

      fireEvent.change(inputs[0], { target: { value: '99' } });
      expect((inputs[0] as HTMLInputElement).value).toBe('99');
    });
  });

  describe('Draw Detection', () => {
    it('should show winner selection dialog when scores are equal', async () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Enter equal scores for Alice vs Bob
      // Alice's score against Bob (row 0, col 1)
      fireEvent.change(inputs[0], { target: { value: '5' } });
      // Bob's score against Alice (row 1, col 0)
      fireEvent.change(inputs[2], { target: { value: '5' } });

      await waitFor(() => {
        expect(screen.getByText('Select winner')).toBeTruthy();
        // The dialog shows the players in the order detected (Bob vs Alice since Bob's cell triggered the draw)
        expect(screen.getByText('Bob 5 - 5 Alice')).toBeTruthy();
      });
    });

    it('should close dialog and set winner when player is selected', async () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Enter equal scores
      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '5' } });

      await waitFor(() => {
        expect(screen.getByText('Select winner')).toBeTruthy();
      });

      // Select Alice as winner
      const aliceButton = screen.getByRole('button', { name: 'Alice' });
      fireEvent.click(aliceButton);

      await waitFor(() => {
        expect(screen.queryByText('Select winner')).toBeNull();
      });
    });

    it('should allow canceling winner selection dialog', async () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Enter equal scores
      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '5' } });

      await waitFor(() => {
        expect(screen.getByText('Select winner')).toBeTruthy();
      });

      // Click Back button in dialog - it's the one inside the fixed container (first Back button)
      const backButtons = screen.getAllByRole('button', { name: 'Back' });
      // The dialog Back button is the first one (inside the dialog), main Back button is the second
      fireEvent.click(backButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Select winner')).toBeNull();
      });
    });

    it('should show unresolved draws count', async () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Enter equal scores
      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '5' } });

      // Close the dialog without selecting winner
      await waitFor(() => {
        expect(screen.getByText('Select winner')).toBeTruthy();
      });

      const backButtons = screen.getAllByRole('button', { name: 'Back' });
      fireEvent.click(backButtons[backButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText('(1 draw(s) need resolution)')).toBeTruthy();
      });
    });
  });

  describe('V Notation Display', () => {
    it('should display existing matches with V notation for winner with 5 hits', () => {
      mockTournamentContext.players = [
        createMockPlayer('Alice', [{
          id: 1,
          match: 1,
          player1: 'Alice',
          player2: 'Bob',
          player1_hits: 5,
          player2_hits: 3,
          winner: 'Alice',
          tournament_id: 1,
          round: 1,
          submitted_by_token: null,
          submitted_at: null,
        }]),
        createMockPlayer('Bob', [{
          id: 1,
          match: 1,
          player1: 'Alice',
          player2: 'Bob',
          player1_hits: 5,
          player2_hits: 3,
          winner: 'Alice',
          tournament_id: 1,
          round: 1,
          submitted_by_token: null,
          submitted_at: null,
        }]),
        createMockPlayer('Charlie'),
      ];

      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      // Existing matches are now editable inputs that show the score values
      const inputs = screen.getAllByRole('spinbutton');

      // Find Alice's score vs Bob (5) and Bob's score vs Alice (3)
      // The inputs should be pre-populated with the existing match data
      const inputValues = inputs.map(input => (input as HTMLInputElement).value);

      // Alice's score against Bob is 5 (she won)
      expect(inputValues).toContain('5');
      // Bob's score against Alice is 3 (he lost)
      expect(inputValues).toContain('3');
    });

    it('should display V with score for non-5 wins', () => {
      mockTournamentContext.players = [
        createMockPlayer('Alice', [{
          id: 1,
          match: 1,
          player1: 'Alice',
          player2: 'Bob',
          player1_hits: 4,
          player2_hits: 2,
          winner: 'Alice',
          tournament_id: 1,
          round: 1,
          submitted_by_token: null,
          submitted_at: null,
        }]),
        createMockPlayer('Bob', [{
          id: 1,
          match: 1,
          player1: 'Alice',
          player2: 'Bob',
          player1_hits: 4,
          player2_hits: 2,
          winner: 'Alice',
          tournament_id: 1,
          round: 1,
          submitted_by_token: null,
          submitted_at: null,
        }]),
        createMockPlayer('Charlie'),
      ];

      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      // Existing matches are now editable inputs that show the score values
      const inputs = screen.getAllByRole('spinbutton');

      // Find Alice's score vs Bob (4) and Bob's score vs Alice (2)
      const inputValues = inputs.map(input => (input as HTMLInputElement).value);

      // Alice's score against Bob is 4 (she won)
      expect(inputValues).toContain('4');
      // Bob's score against Alice is 2 (he lost)
      expect(inputValues).toContain('2');
    });
  });

  describe('Pending Matches', () => {
    it('should count pending matches correctly', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      // Initially no pending matches
      expect(screen.getByText('0 matches pending')).toBeTruthy();
    });

    it('should update pending count when entering complete match data', async () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Enter non-equal scores (no draw dialog needed)
      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });

      await waitFor(() => {
        expect(screen.getByText('1 matches pending')).toBeTruthy();
      });
    });

    it('should not count matches with unresolved draws', async () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Enter equal scores
      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '5' } });

      // Close dialog without selecting winner
      await waitFor(() => {
        expect(screen.getByText('Select winner')).toBeTruthy();
      });

      const backButtons = screen.getAllByRole('button', { name: 'Back' });
      fireEvent.click(backButtons[backButtons.length - 1]);

      await waitFor(() => {
        // Should show 0 pending because the draw is unresolved
        expect(screen.getByText('0 matches pending')).toBeTruthy();
      });
    });
  });

  describe('Submit Functionality', () => {
    it('should disable submit button when no matches to submit', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const submitButton = screen.getByRole('button', { name: 'Submit Results' });

      // Button should be disabled when no pending matches
      expect((submitButton as HTMLButtonElement).disabled).toBe(true);
    });

    it('should submit matches successfully', async () => {
      const mockMatch = {
        id: 1,
        match: 1,
        player1: 'Alice',
        player2: 'Bob',
        player1_hits: 5,
        player2_hits: 3,
        winner: 'Alice',
        tournament_id: 1,
        round: 1,
        submitted_by_token: null,
        submitted_at: null,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatch,
      });

      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      // Enter non-equal scores
      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });

      await waitFor(() => {
        expect(screen.getByText('1 matches pending')).toBeTruthy();
      });

      const submitButton = screen.getByRole('button', { name: 'Submit Results' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/matches',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      // Should close modal on success
      await waitFor(() => {
        expect(mockCloseModal).toHaveBeenCalled();
      });
    });

    it('should handle 409 conflict error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 409,
      });

      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });

      await waitFor(() => {
        expect(screen.getByText('1 matches pending')).toBeTruthy();
      });

      const submitButton = screen.getByRole('button', { name: 'Submit Results' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Match already exists/)).toBeTruthy();
      });

      // Should not close modal on error
      expect(mockCloseModal).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const inputs = screen.getAllByRole('spinbutton');

      fireEvent.change(inputs[0], { target: { value: '5' } });
      fireEvent.change(inputs[2], { target: { value: '3' } });

      await waitFor(() => {
        expect(screen.getByText('1 matches pending')).toBeTruthy();
      });

      const submitButton = screen.getByRole('button', { name: 'Submit Results' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeTruthy();
      });
    });
  });

  describe('Back Button', () => {
    it('should call closeModal when back button is clicked', () => {
      render(<BulkMatchEntry closeModal={mockCloseModal} />);

      const backButton = screen.getByRole('button', { name: 'Back' });
      fireEvent.click(backButton);

      expect(mockCloseModal).toHaveBeenCalled();
    });
  });
});
