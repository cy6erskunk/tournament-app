"use server";

import { Result } from "@/types/result";
import { db } from "./database";
import Tournament from "@/types/Tournament";
import { sql } from "kysely";
import { RoundRobinCount } from "@/types/RoundRobinCount";

export async function getTournament(
  name: string,
): Promise<Result<Tournament, string>> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .where("name", "=", name)
      .selectAll()
      .executeTakeFirst()

    if (!tournaments) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error fetching tournaments" };
  }
}

export async function getTournamentWithId(
  id: number,
): Promise<Result<Tournament, string>> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst()

    if (!tournaments) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Error fetching tournaments" };
  }
}

// get tournament with Date
export async function getTournamentToday(
  dateToday: Date,
): Promise<Result<Tournament, string>> {
  try {
    const tournament = await db
      .selectFrom("tournaments")
      .selectAll()
      .where("date", "=", dateToday)
      .executeTakeFirst()

    if (!tournament) {
      return { success: false, error: "No tournament found" };
    }

    return { success: true, value: tournament as Tournament };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournament players" };
  }
}

// get recent tournaments
export async function getRecentTournaments(getOffset: number): Promise<
  Result<Tournament[], string>
> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .selectAll()
      .orderBy("id desc")
      .offset(getOffset)
      .limit(20)
      .execute();

    if (!tournaments.length) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments as Tournament[] };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournaments" };
  }
}

// get round robin tournaments and player count for brackets seeding
export async function getRoundRobinTournaments(): Promise<
  Result<RoundRobinCount[], string>
> {
  try {
    const tournaments = await db
      .selectFrom("tournaments")
      .innerJoin(
        "tournament_players",
        "tournament_players.tournament_id",
        "tournaments.id",
      )
      .select([
        "tournaments.id",
        "tournaments.name",
        sql`count(tournament_players.player_name)`.as("playersCount"),
      ])
      .where("format", "=", "Round Robin")
      .groupBy("tournaments.id")
      .having((eb) => eb.fn.count("tournament_players.player_name"), ">", 0)
      .limit(10)
      .orderBy("tournaments.id desc")
      .execute();

    if (!tournaments.length) {
      return { success: false, error: "No tournaments found" };
    }

    return { success: true, value: tournaments as RoundRobinCount[] };
  } catch (error) {
    console.log(error);
    return { success: false, error: "Could not fetch tournaments" };
  }
}
