import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Addplayer from "./addplayer";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: "Add player",
      title2: "New player",
      name: "Name",
      submit: "Submit",
      back: "Back",
      emptyname: "Add name",
      nametoolong: "Max length 16 characters",
      alreadyintournament: "Player is already in the tournament",
      erroraddingplayer: "Error adding player",
      unauth: "Unauthorized access",
      pool: "Pool",
    };
    return translations[key] || key;
  },
}));

// Mock TournamentContext
const mockSetPlayers = vi.fn();
const mockTournamentContext = {
  tournament: { id: 1, name: "Test Tournament", format: "Round Robin" },
  players: [] as unknown[],
  setPlayers: mockSetPlayers,
  pools: [{ id: 1, tournament_id: 1, name: "Pool 1" }],
  loading: false,
};

vi.mock("@/context/TournamentContext", () => ({
  useTournamentContext: () => mockTournamentContext,
}));

describe("Addplayer - pool dropdown", () => {
  const mockCloseModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    global.alert = vi.fn();
    mockTournamentContext.tournament = {
      id: 1,
      name: "Test Tournament",
      format: "Round Robin",
    };
    mockTournamentContext.players = [];
    mockTournamentContext.pools = [{ id: 1, tournament_id: 1, name: "Pool 1" }];
  });

  it("shows pool dropdown for Round Robin tournament when pools exist", () => {
    const { container } = render(
      <Addplayer closeModal={mockCloseModal} playerList={[]} />,
    );

    // The pool select element is rendered alongside the datalist-backed input.
    // Use a direct DOM query to avoid ambiguity with the combobox role.
    const select = container.querySelector('select[name="poolId"]');
    expect(select).not.toBeNull();
    expect(screen.getByText("Pool 1")).toBeTruthy();
  });

  it("hides pool dropdown for Round Robin tournament when pools list is empty", () => {
    mockTournamentContext.pools = [];

    const { container } = render(
      <Addplayer closeModal={mockCloseModal} playerList={[]} />,
    );

    expect(container.querySelector('select[name="poolId"]')).toBeNull();
  });

  it("hides pool dropdown for non-Round Robin tournament even when pools exist", () => {
    mockTournamentContext.tournament = {
      id: 1,
      name: "Test Tournament",
      format: "Bracket",
    };

    const { container } = render(
      <Addplayer closeModal={mockCloseModal} playerList={[]} />,
    );

    expect(container.querySelector('select[name="poolId"]')).toBeNull();
  });

  it("shows all pools in the dropdown when multiple pools exist", () => {
    mockTournamentContext.pools = [
      { id: 1, tournament_id: 1, name: "Pool 1" },
      { id: 2, tournament_id: 1, name: "Pool 2" },
      { id: 3, tournament_id: 1, name: "Pool 3" },
    ];

    render(<Addplayer closeModal={mockCloseModal} playerList={[]} />);

    expect(screen.getByText("Pool 1")).toBeTruthy();
    expect(screen.getByText("Pool 2")).toBeTruthy();
    expect(screen.getByText("Pool 3")).toBeTruthy();
  });

  it("submits poolId when adding player to Round Robin tournament", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        player_name: "Alice",
        tournament_id: 1,
        pool_id: 1,
      }),
    });

    render(<Addplayer closeModal={mockCloseModal} playerList={[]} />);

    // The name input has type="text" with a datalist; query by placeholder
    const nameInput = screen.getByPlaceholderText("Name");
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    fireEvent.submit(nameInput.closest("form")!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/addplayer",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"poolId":1'),
        }),
      );
    });
  });

  it("does not submit poolId for non-Round Robin tournament", async () => {
    mockTournamentContext.tournament = {
      id: 1,
      name: "Test Tournament",
      format: "Bracket",
    };
    mockTournamentContext.pools = [{ id: 1, tournament_id: 1, name: "Pool 1" }];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ player_name: "Alice", tournament_id: 1 }),
    });

    render(<Addplayer closeModal={mockCloseModal} playerList={[]} />);

    const nameInput = screen.getByPlaceholderText("Name");
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    fireEvent.submit(nameInput.closest("form")!);

    await waitFor(() => {
      const body = JSON.parse(
        (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      expect(body.poolId).toBeNull();
    });
  });
});
