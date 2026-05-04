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

const mockUseUserContext = vi.fn(() => ({ user: null, setUser: vi.fn() }));
vi.mock("@/context/UserContext", () => ({
  useUserContext: () => mockUseUserContext(),
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
    seedFromPools: "Seed bracket from pools round",
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

  it("falls back to all matches when no matches have the active round_id (legacy data with multiple elimination rounds)", () => {
    // Matches exist but all have round_id = null (migrated before Step 4).
    // The bracket should not go blank.
    const legacyAlice: Player = {
      player: { ...alice.player },
      matches: [{ ...elim1Match, round_id: null }],
    };
    const legacyBob: Player = {
      player: { ...bob.player },
      matches: [{ ...elim1Match, round_id: null }],
    };

    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2, // round_id=10, but no matches carry it
      players: [legacyAlice, legacyBob],
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    // Both players should still appear (fallback to unfiltered)
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("renders an empty bracket when there are no players", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2,
      players: [],
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    // No player cells should appear
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.queryByText("Bob")).toBeNull();
  });
});

// ── Seed-from-pools tests ───────────────────────────────────────────────────

const adminUser = { user: { role: "admin", username: "admin" }, setUser: vi.fn() };

const poolsRound = { id: 5, tournament_id: 1, round_order: 1, type: "pools" };
const elimRound = { id: 6, tournament_id: 1, round_order: 2, type: "elimination" };

const poolMatch = {
  ...{ tournament_id: 1, submitted_by_token: null, submitted_at: null },
  id: 99,
  player1: "Alice",
  player2: "Bob",
  player1_hits: 5,
  player2_hits: 2,
  winner: "Alice",
  match: 1,
  round_id: 5,
};

const aliceWithPoolMatch: Player = {
  player: { player_name: "Alice", tournament_id: 1, bracket_match: null, bracket_seed: null, pool_id: null },
  matches: [poolMatch],
};
const bobWithPoolMatch: Player = {
  player: { player_name: "Bob", tournament_id: 1, bracket_match: null, bracket_seed: null, pool_id: null },
  matches: [poolMatch],
};

describe("Brackets/Tournament — seed from pools round", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserContext.mockReturnValue({ user: null, setUser: vi.fn() });
  });

  it("shows 'seed from pools' button when admin views unseeded elimination round that follows a pools round", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2,
      rounds: [poolsRound, elimRound],
      players: [aliceWithPoolMatch, bobWithPoolMatch],
    });
    mockUseUserContext.mockReturnValue(adminUser);

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Seed bracket from pools round")).toBeTruthy();
  });

  it("does not show 'seed from pools' button when players are already seeded", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2,
      rounds: [poolsRound, elimRound],
      players: [
        { ...aliceWithPoolMatch, player: { ...aliceWithPoolMatch.player, bracket_seed: 1 } },
        { ...bobWithPoolMatch, player: { ...bobWithPoolMatch.player, bracket_seed: 2 } },
      ],
    });
    mockUseUserContext.mockReturnValue(adminUser);

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByText("Seed bracket from pools round")).toBeNull();
  });

  it("does not show 'seed from pools' button for non-admin users", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2,
      rounds: [poolsRound, elimRound],
      players: [aliceWithPoolMatch, bobWithPoolMatch],
    });

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByText("Seed bracket from pools round")).toBeNull();
  });

  it("does not show 'seed from pools' button when the active round has no preceding pools round", () => {
    mockUseTournamentContext.mockReturnValue({
      ...baseTournamentContext,
      activeRound: 2,
      rounds: twoEliminationRounds,
      players: [alice, bob],
    });
    mockUseUserContext.mockReturnValue(adminUser);

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Tournament />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByText("Seed bracket from pools round")).toBeNull();
  });
});
