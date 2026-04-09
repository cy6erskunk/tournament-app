import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import Tournament from "./Tournament";
import type { Player } from "@/types/Player";

// ── Mock dependencies ───────────────────────────────────────────────────────

vi.mock("@/database/getTournament", () => ({
  getTournamentsForSeeding: vi
    .fn()
    .mockResolvedValue({ success: true, value: [] }),
}));

vi.mock("@/context/UserContext", () => ({
  useUserContext: () => ({ user: null, setUser: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en", id: "1" }),
}));

vi.mock("@/components/Results/Title", () => ({
  TournamentTitle: () => <span>Test Tournament</span>,
}));

// RoundNav just displays navigation — not under test here
vi.mock("@/components/rounds", () => ({
  default: () => null,
}));

// Prevent Modal/AddMatch from rendering and pulling in more context deps
vi.mock("@/components/modal", () => ({
  default: ({
    children,
    isOpen,
  }: {
    children: React.ReactNode;
    isOpen: boolean;
  }) => (isOpen ? <div>{children}</div> : null),
}));

vi.mock("@/components/newmatch", () => ({
  default: () => null,
}));

const mockUseTournamentContext = vi.fn();
vi.mock("@/context/TournamentContext", () => ({
  useTournamentContext: () => mockUseTournamentContext(),
}));

// ── Translation messages ────────────────────────────────────────────────────

const messages = {
  Brackets: {
    selectseed: "Select a tournament to seed from",
    noRRtournamentsfound: "No tournaments found",
  },
  NewMatch: {
    match: "Match",
    title: "Round",
    player1: "Player 1",
    player2: "Player 2",
    points: "Points",
    submit: "Submit",
    back: "Back",
    selectbothplayers: "Select both players",
    duplicateplayers: "Duplicate players",
    selectwinnerfordraw: "Select winner for draw",
    notournamentfound: "No tournament found",
    addmatchfailed: "Add match failed",
    matchexists1: "Match between",
    matchexists2: "already exists for round",
    unexpectederror: "Unexpected error",
    noplayers: "No players",
    tournament: "Tournament",
    generating: "Generating...",
    generateQR: "Generate QR",
    generateNew: "Generate new",
    done: "Done",
  },
};

// ── Test data ───────────────────────────────────────────────────────────────

const baseMatchFields = {
  tournament_id: 1,
  submitted_by_token: null,
  submitted_at: null,
};

/**
 * Round played in elimination round 1 (rounds-table id 10, round_order 2).
 * Alice wins 5-3.
 */
const elim1Match = {
  ...baseMatchFields,
  id: 1,
  player1: "Alice",
  player2: "Bob",
  player1_hits: 5,
  player2_hits: 3,
  winner: "Alice",
  round: 1, // bracket stage depth (final)
  match: 1,
  round_id: 10,
};

/**
 * Round played in elimination round 2 (rounds-table id 11, round_order 3).
 * Bob wins 2-7.
 */
const elim2Match = {
  ...baseMatchFields,
  id: 2,
  player1: "Alice",
  player2: "Bob",
  player1_hits: 2,
  player2_hits: 7,
  winner: "Bob",
  round: 1, // bracket stage depth (final)
  match: 1,
  round_id: 11,
};

const alice: Player = {
  player: {
    player_name: "Alice",
    tournament_id: 1,
    bracket_match: null,
    bracket_seed: null,
    pool_id: null,
  },
  matches: [elim1Match, elim2Match],
};

const bob: Player = {
  player: {
    player_name: "Bob",
    tournament_id: 1,
    bracket_match: null,
    bracket_seed: null,
    pool_id: null,
  },
  matches: [elim1Match, elim2Match],
};

const twoEliminationRounds = [
  { id: 10, tournament_id: 1, round_order: 2, type: "elimination" },
  { id: 11, tournament_id: 1, round_order: 3, type: "elimination" },
];

const baseTournamentContext = {
  tournament: {
    id: 1,
    name: "Test Tournament",
    format: "Brackets",
    date: new Date(),
  },
  setTournament: vi.fn(),
  players: [alice, bob] as (Player | null)[],
  setPlayers: vi.fn(),
  pools: [],
  setPools: vi.fn(),
  loading: false,
  setLoading: vi.fn(),
  setActiveRound: vi.fn(),
  hidden: false,
  setHidden: vi.fn(),
  rounds: twoEliminationRounds,
  setRounds: vi.fn(),
};

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Brackets/Tournament — multi-elimination round switching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Alice as winner when first elimination round (round_id=10) is active", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2, // maps to rounds-table row with id=10
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    // Alice wins in elim1Match → Bob is the loser and gets line-through
    expect(screen.getByText("Bob").className).toContain("line-through");
    expect(screen.getByText("Alice").className).not.toContain("line-through");
  });

  it("shows Bob as winner when second elimination round (round_id=11) is active", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 3, // maps to rounds-table row with id=11
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    // Bob wins in elim2Match → Alice is the loser and gets line-through
    expect(screen.getByText("Alice").className).toContain("line-through");
    expect(screen.getByText("Bob").className).not.toContain("line-through");
  });

  it("does not filter matches for a single elimination round (legacy fallback)", () => {
    // With only one elimination round, round_id filtering is skipped so legacy
    // tournaments (round_id = null) continue to work.
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 1,
      rounds: [{ id: 10, tournament_id: 1, round_order: 1, type: "elimination" }],
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    // Both players appear in the bracket without errors
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("renders an empty bracket when there are no players", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2,
      players: [],
    });

    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    // No player cells should appear
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.queryByText("Bob")).toBeNull();
  });
});
