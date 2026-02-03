import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import TournamentButtons from "./TournamentButtons";

// Mock the TournamentContext
const mockUseTournamentContext = vi.fn();
vi.mock("@/context/TournamentContext", () => ({
  useTournamentContext: () => mockUseTournamentContext(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en", id: "1" }),
}));

// Mock getPlayer database function
vi.mock("@/database/getPlayers", () => ({
  getPlayer: vi.fn().mockResolvedValue({ success: true, value: [] }),
}));

const messages = {
  Tournament: {
    Buttons: {
      addmatch: "Add match",
      addplayer: "Add player",
      leaderboard: "Leaderboard",
      back: "Back",
    },
  },
};

const defaultContextValue = {
  tournament: null,
  setTournament: vi.fn(),
  players: [],
  setPlayers: vi.fn(),
  loading: false,
  setLoading: vi.fn(),
  activeRound: 1,
  setActiveRound: vi.fn(),
  hidden: true,
  setHidden: vi.fn(),
};

describe("TournamentButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show Add match button for Round Robin tournaments", () => {
    mockUseTournamentContext.mockReturnValue({
      ...defaultContextValue,
      tournament: { id: 1, format: "Round Robin" },
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TournamentButtons />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("Add match")).toBeTruthy();
    expect(screen.getByText("Generate QR Match")).toBeTruthy();
    expect(screen.getByText("Add player")).toBeTruthy();
    expect(screen.getByText("Leaderboard")).toBeTruthy();
  });

  it("should not show Add match button for non-Round Robin tournaments", () => {
    mockUseTournamentContext.mockReturnValue({
      ...defaultContextValue,
      tournament: { id: 1, format: "Bracket" },
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TournamentButtons />
      </NextIntlClientProvider>
    );

    expect(screen.queryByText("Add match")).toBeNull();
    // Other buttons should still be visible
    expect(screen.getByText("Generate QR Match")).toBeTruthy();
    expect(screen.getByText("Add player")).toBeTruthy();
  });

  it("should not show Add match button when tournament is undefined", () => {
    mockUseTournamentContext.mockReturnValue({
      ...defaultContextValue,
      tournament: undefined,
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TournamentButtons />
      </NextIntlClientProvider>
    );

    expect(screen.queryByText("Add match")).toBeNull();
    // Other buttons should still be visible
    expect(screen.getByText("Generate QR Match")).toBeTruthy();
    expect(screen.getByText("Add player")).toBeTruthy();
  });

  it("should return null when players are seeded", () => {
    mockUseTournamentContext.mockReturnValue({
      ...defaultContextValue,
      players: [
        {
          player: {
            bracket_seed: 1,
            bracket_match: null,
            player_name: "Test Player",
            tournament_id: 1,
          },
          matches: [],
        },
      ],
      tournament: { id: 1, format: "Round Robin" },
    });

    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TournamentButtons />
      </NextIntlClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});
