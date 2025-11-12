import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditMatch from './matchediting';
import { Player } from '@/types/Player';
import { MatchRow } from '@/types/MatchTypes';

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
      'delete': 'Delete',
      'selectbothplayers': 'Select both players before submitting',
      'duplicateplayers': 'Selected players can not be the same',
      'selectwinnerfordraw': 'Select a winner by priority',
      'notournamentfound': 'No tournament found',
      'addmatchfailed': 'Failed to add match',
      'matchupdated': 'Match updated',
      'matchdeleted': 'Match deleted',
      'matchexists1': 'Match between',
      'matchexists2': 'already exists for round',
      'unexpectederror': 'Unexpected error',
    };
    return translations[key] || key;
  },
}));

// Mock TournamentContext
const mockSetPlayers = vi.fn((updater) => {
  if (typeof updater === 'function') {
    mockTournamentContext.players = updater(mockTournamentContext.players);
  } else {
    mockTournamentContext.players = updater;
  }
});
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
  TournamentContext: {},
}));

describe('EditMatch - Priority Wins', () => {
  const mockCloseModal = vi.fn();

  const existingMatch: MatchRow = {
    id: 1,
    player1: 'Alice',
    player2: 'Bob',
    player1_hits: 5,
    player2_hits: 3,
    winner: 'Alice',
    tournament_id: 1,
    round: 1,
    match: 1,
  };

  const mockPlayer: Player = {
    player: {
      player_name: 'Alice',
      tournament_id: 1,
      bracket_match: null,
      bracket_seed: null,
    },
    matches: [existingMatch],
  };

  const mockOpponent: Player = {
    player: {
      player_name: 'Bob',
      tournament_id: 1,
      bracket_match: null,
      bracket_seed: null,
    },
    matches: [existingMatch],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTournamentContext.players = [mockPlayer, mockOpponent];
    global.fetch = vi.fn();
    global.alert = vi.fn();
  });

  it('should load existing match data and show priority buttons when scores are equal', () => {
    const drawMatch: MatchRow = {
      ...existingMatch,
      player1_hits: 5,
      player2_hits: 5,
      winner: 'Alice',
    };

    const playerWithDraw: Player = {
      player: {
        player_name: 'Alice',
        tournament_id: 1,
        bracket_match: null,
        bracket_seed: null,
      },
      matches: [drawMatch],
    };

    const opponentWithDraw: Player = {
      player: {
        player_name: 'Bob',
        tournament_id: 1,
        bracket_match: null,
        bracket_seed: null,
      },
      matches: [drawMatch],
    };

    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={playerWithDraw}
        opponent={opponentWithDraw}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' }) as HTMLInputElement;
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' }) as HTMLInputElement;

    // Check that existing values are loaded
    expect(points1Input.value).toBe('5');
    expect(points2Input.value).toBe('5');

    // Priority radio buttons should be visible (not have opacity-0)
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className).not.toContain('opacity-0');
      expect(radio.disabled).toBe(false);
    });
  });

  it('should hide priority radio buttons when editing scores to be different', () => {
    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });

    // Change to different scores
    fireEvent.change(points1Input, { target: { value: '7' } });
    fireEvent.change(points2Input, { target: { value: '3' } });

    // Priority radio buttons should be hidden (opacity-0)
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className).toContain('opacity-0');
      expect(radio.disabled).toBe(true);
    });
  });

  it('should prevent update when scores are equal but no priority winner selected', async () => {
    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const updateButton = screen.getByText('Submit');

    // Set equal scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Try to update without selecting priority winner
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Select a winner by priority');
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockCloseModal).not.toHaveBeenCalled();
  });

  it('should allow update when scores are equal and priority winner is selected', async () => {
    const updatedMatch: MatchRow = {
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
      json: async () => updatedMatch,
    });

    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const updateButton = screen.getByText('Submit');

    // Set equal scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Select priority winner (first radio button for Alice)
    const radioButtons = screen.getAllByRole('radio');
    fireEvent.click(radioButtons[0]);

    // Submit update
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"winner":"Alice"'),
        })
      );
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Match updated');
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should allow update with different scores without priority selection', async () => {
    const updatedMatch: MatchRow = {
      id: 1,
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 8,
      player2_hits: 3,
      winner: 'Alice',
      tournament_id: 1,
      round: 1,
      match: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedMatch,
    });

    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const updateButton = screen.getByText('Submit');

    // Set different scores
    fireEvent.change(points1Input, { target: { value: '8' } });
    fireEvent.change(points2Input, { target: { value: '3' } });

    // Submit update without priority selection (should work)
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"winner":"Alice"'),
        })
      );
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Match updated');
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should allow selecting player2 as priority winner in edited match', async () => {
    const updatedMatch: MatchRow = {
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
      json: async () => updatedMatch,
    });

    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const updateButton = screen.getByText('Submit');

    // Set equal scores
    fireEvent.change(points1Input, { target: { value: '5' } });
    fireEvent.change(points2Input, { target: { value: '5' } });

    // Select priority winner (second radio button for Bob)
    const radioButtons = screen.getAllByRole('radio');
    fireEvent.click(radioButtons[1]);

    // Submit update
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"winner":"Bob"'),
        })
      );
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Match updated');
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should allow deleting a match', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
    });

    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const deleteButton = screen.getByText('Delete');

    // Click delete
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Match deleted');
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should dynamically show/hide priority buttons when scores change', () => {
    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });

    // Start with different scores - priority should be hidden
    fireEvent.change(points1Input, { target: { value: '7' } });
    fireEvent.change(points2Input, { target: { value: '3' } });

    let radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className).toContain('opacity-0');
      expect(radio.disabled).toBe(true);
    });

    // Change to equal scores
    fireEvent.change(points2Input, { target: { value: '7' } });

    // Priority buttons should now be visible
    radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className).not.toContain('opacity-0');
      expect(radio.disabled).toBe(false);
    });

    // Change back to different scores
    fireEvent.change(points1Input, { target: { value: '9' } });

    // Priority buttons should be hidden again
    radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      const parentDiv = radio.parentElement;
      expect(parentDiv?.className).toContain('opacity-0');
      expect(radio.disabled).toBe(true);
    });
  });

  it('should update context with match data after successful update', async () => {
    const updatedMatch: MatchRow = {
      id: 1,
      player1: 'Alice',
      player2: 'Bob',
      player1_hits: 10,
      player2_hits: 7,
      winner: 'Alice',
      tournament_id: 1,
      round: 1,
      match: 1,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedMatch,
    });

    render(
      <EditMatch
        closeModal={mockCloseModal}
        player={mockPlayer}
        opponent={mockOpponent}
      />
    );

    const points1Input = screen.getByLabelText('Points', { selector: '#points1' });
    const points2Input = screen.getByLabelText('Points', { selector: '#points2' });
    const updateButton = screen.getByText('Submit');

    // Change scores
    fireEvent.change(points1Input, { target: { value: '10' } });
    fireEvent.change(points2Input, { target: { value: '7' } });

    // Submit update
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/matches',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    await waitFor(() => {
      expect(mockSetPlayers).toHaveBeenCalled();
    });

    expect(mockCloseModal).toHaveBeenCalled();
  });
});
