import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateTournament } from "./updateTournament";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    selectFrom: vi.fn(),
    updateTable: vi.fn(),
  },
}));

const makeSelectMock = (format: string | undefined) =>
  ({
    where: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        executeTakeFirst: vi.fn().mockResolvedValue(
          format !== undefined ? { format } : undefined,
        ),
      }),
    }),
  });

const makeUpdateMock = (numUpdatedRows: number) => ({
  set: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      executeTakeFirst: vi.fn().mockResolvedValue({ numUpdatedRows }),
    }),
  }),
});

describe("updateTournament", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates name successfully", async () => {
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    const result = await updateTournament(1, { name: "New Name" });

    expect(result.success).toBe(true);
  });

  it("returns error when no rows updated", async () => {
    const updateMock = makeUpdateMock(0);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    const result = await updateTournament(1, { name: "New Name" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not update tournament");
    }
  });

  it("allows public_results: true for Round Robin tournaments", async () => {
    (db.selectFrom as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectMock("Round Robin"),
    );
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    const result = await updateTournament(1, {
      name: "RR Tournament",
      public_results: true,
    });

    expect(result.success).toBe(true);
    const setCalls = updateMock.set.mock.calls[0][0] as Record<string, unknown>;
    expect(setCalls.public_results).toBe(true);
  });

  it("coerces public_results to false for non-Round Robin tournaments", async () => {
    (db.selectFrom as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectMock("Brackets"),
    );
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    const result = await updateTournament(1, {
      name: "Bracket Tournament",
      public_results: true,
    });

    expect(result.success).toBe(true);
    const setCalls = updateMock.set.mock.calls[0][0] as Record<string, unknown>;
    expect(setCalls.public_results).toBe(false);
  });

  it("returns error when tournament is not found (0 rows updated)", async () => {
    (db.selectFrom as ReturnType<typeof vi.fn>).mockReturnValue(
      makeSelectMock(undefined),
    );
    // Tournament doesn't exist — UPDATE affects 0 rows
    const updateMock = makeUpdateMock(0);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    const result = await updateTournament(1, {
      name: "Ghost Tournament",
      public_results: true,
    });

    expect(result.success).toBe(false);
    // public_results should have been coerced to false before the UPDATE attempt
    const setCalls = updateMock.set.mock.calls[0][0] as Record<string, unknown>;
    expect(setCalls.public_results).toBe(false);
  });

  it("skips format check when public_results is not provided", async () => {
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    await updateTournament(1, { name: "Any Tournament" });

    expect(db.selectFrom).not.toHaveBeenCalled();
  });

  it("skips format check when public_results is false", async () => {
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    await updateTournament(1, { name: "Any Tournament", public_results: false });

    expect(db.selectFrom).not.toHaveBeenCalled();
  });

  it("returns error when database throws", async () => {
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          executeTakeFirst: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const result = await updateTournament(1, { name: "Test" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Could not update tournament");
    }
  });
});
