import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddMatch from './newmatch';
import { Player } from '@/types/Player';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'title': 'New Match',
      'title2': 'Edit Match',
      'player1': 'Player 1',
      'player2': 'Player 2',
      'points': 'Points',
      'submit': 'Submit',
      'back': 'Back',
      'selectbothplayers': 'Select both players before submitting',
      'duplicateplayers': 'Selected players can not be the same',
      'selectwinnerfordraw': 'Select a winner by priority',
      'notournamentfound': 'No tournament found',
      'addmatchfailed': 'Failed to add match',
      'matchexists1': 'Match between',
      'matchexists2': 'already exists for round',
      'unexpectederror': 'Unexpected error',
      'noplayers': 'No players in this tournament',
    };
    return translations[key] || key;
  },
}));

// Mock TournamentContext
const mockSetPlayers = vi.fn();
const mockTournamentContext = {
  tournament: { id: 1, name: 'Test Tournament', format: 'Round-robin', date: new Date() },
  setTournament: vi.fn(),
  players: [] as (Player | null)[],
  setPlayers: mockSetPlayers,
  activeRound: 1,
  setActiveRound: vi.fn(),
};

vi.mock('@/context/TournamentContext', () => ({
  useTournamentContext: () => mockTournamentContext,
}));

describe('AddMatch - Priority Wins', () => {
  const mockCloseModal = vi.fn();
  const mockPlayer: Player = {
    player: {
      player_name: 'Alice',
      tournament_id: 1,
      bracket_match: null,
      bracket_seed: null,
    },
    matches: [],
  };
  const mockOpponent: Player = {
    player: {
      player_name: 'Bob',
      tournament_id: 1,
      bracket_match: null,
      bracket_seed: null,
    },
    matches: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTournamentContext.players = [mockPlayer, mockOpponent];
    global.fetch = vi.fn();
    global.alert = vi.fn();
  });

  it('should hide priority radio buttons when scores are different', () => {
    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });

    // Set different scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '3' } });

    // Priority radio buttons should be hidden (opacity-0)
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className.includes('opacity-0')).toBe(true);
    });
  });

  it('should show priority radio buttons when scores are equal', () => {
    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });

    // Set equal scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Priority radio buttons should be visible (not have opacity-0)
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className.includes('opacity-0')).toBe(false);
      expect(radio.disabled).toBe(false);
    });
  });

  it('should prevent submission when scores are equal but no priority winner selected', async () => {
    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const submitButton = screen.getByText('Submit');

    // Set equal scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Try to submit without selecting priority winner
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Select a winner by priority');
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCloseModal).not.toHaveBeenCalled();
  });

  it('should allow submission when scores are equal and priority winner is selected', async () => {
    const mockMatch = {
      id: 1,
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 5,
      player2_hits: 5,
      winner: 'Alice',
      tournament_id: 1,
      round: 1,
      match: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatch,
    });

    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const submitButton = screen.getByText('Submit');

    // Set equal scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Select priority winner (first radio button for Alice)
    const radioButtons = screen.getAllByRole('radio');
    fireEvent.click(radioButtons[0]);

    // Submit
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"winner":"Alice"'),
        })
      );
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should automatically determine winner when scores are different', async () => {
    const mockMatch = {
      id: 1,
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 7,
      player2_hits: 3,
      winner: 'Alice',
      tournament_id: 1,
      round: 1,
      match: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatch,
    });

    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const submitButton = screen.getByText('Submit');

    // Set different scores with player1 winning
    fireEvent.change(points1Input, { target: { value: '7' } });
    fireEvent.change(points2Input, { target: { value: '3' } });

    // Submit without selecting priority (should work)
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"winner":"Alice"'),
        })
      );
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should set player2 as winner when player2 has higher score', async () => {
    const mockMatch = {
      id: 1,
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 3,
      player2_hits: 7,
      winner: 'Bob',
      tournament_id: 1,
      round: 1,
      match: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatch,
    });

    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const submitButton = screen.getByText('Submit');

    // Set different scores with player2 winning
    fireEvent.change(points1Input, { target: { value: '3' } });
    fireEvent.change(points2Input, { target: { value: '7' } });

    // Submit
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"winner":"Bob"'),
        })
      );
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should allow selecting player2 as priority winner in a draw', async () => {
    const mockMatch = {
      id: 1,
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 5,
      player2_hits: 5,
      winner: 'Bob',
      tournament_id: 1,
      round: 1,
      match: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMatch,
    });

    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const submitButton = screen.getByText('Submit');

    // Set equal scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Select priority winner (second radio button for Bob)
    const radioButtons = screen.getAllByRole('radio');
    fireEvent.click(radioButtons[1]);

    // Submit
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"winner":"Bob"'),
        })
      );
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should update state correctly when scores change from equal to different', () => {
    render(
      <AddMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });

    // Start with equal scores (0-0 by default) - priority should be visible
    let radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className.includes('opacity-0')).toBe(false);
    });

    // Change to different scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '3' } });

    // Priority buttons should now be hidden
    radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className.includes('opacity-0')).toBe(true);
      expect(radio.disabled).toBe(true);
    });

    // Change back to equal scores
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Priority buttons should be visible again
    radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className.includes('opacity-0')).toBe(false);
      expect(radio.disabled).toBe(false);
    });
  });
});
