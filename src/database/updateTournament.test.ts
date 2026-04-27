import { describe, it, expect, beforeEach, vi } from "vitest";
import { updateTournament } from "./updateTournament";
import { db } from "./database";

vi.mock("./database", () => ({
  db: {
    updateTable: vi.fn(),
  },
}));

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

  it("allows public_results: true to be set directly", async () => {
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

  it("allows public_results: true for any tournament type", async () => {
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    const result = await updateTournament(1, {
      name: "Bracket Tournament",
      public_results: true,
    });

    expect(result.success).toBe(true);
    const setCalls = updateMock.set.mock.calls[0][0] as Record<string, unknown>;
    expect(setCalls.public_results).toBe(true);
  });

  it("returns error when tournament is not found (0 rows updated)", async () => {
    // Tournament doesn't exist — UPDATE affects 0 rows
    const updateMock = makeUpdateMock(0);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    const result = await updateTournament(1, {
      name: "Ghost Tournament",
      public_results: true,
    });

    expect(result.success).toBe(false);
  });

  it("omits public_results from update when not provided", async () => {
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    await updateTournament(1, { name: "Any Tournament" });

    const setCalls = updateMock.set.mock.calls[0][0] as Record<string, unknown>;
    expect(setCalls.public_results).toBeUndefined();
  });

  it("passes public_results: false through unchanged", async () => {
    const updateMock = makeUpdateMock(1);
    (db.updateTable as ReturnType<typeof vi.fn>).mockReturnValue(updateMock);

    await updateTournament(1, { name: "Any Tournament", public_results: false });

    const setCalls = updateMock.set.mock.calls[0][0] as Record<string, unknown>;
    expect(setCalls.public_results).toBe(false);
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
