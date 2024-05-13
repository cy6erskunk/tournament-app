"use server";

import { getTournamentPlayers } from "@/database/getTournamentPlayers";
import { addPlayers } from "@/database/newPlayer";
import { getSession } from "@/helpers/getsession";
import winPercentage from "@/helpers/winPercentage";
import { Player } from "@/types/Player";

type Params = {
  params: {
    tournamentId: string;
    currentId: string;
  };
};

function seeding(players: Player[]) {
  let participantsCount = players.length;
  let rounds = Math.ceil(Math.log(participantsCount) / Math.log(2));
  let bracketSize = Math.pow(2, rounds);
  let requiredByes = bracketSize - participantsCount;

  // console.log(`Number of participants: ${participantsCount}`);
  // console.log(`Number of rounds: ${rounds}`);
  // console.log(`Bracket size: ${bracketSize}`);
  // console.log(`Required number of byes: ${requiredByes}`);

  if (participantsCount < 2) {
    return [];
  }

  let matches = [[1, 2]];

  for (let round = 1; round < rounds; round++) {
    let roundMatches: number[][] = [];
    let sum = Math.pow(2, round + 1) + 1;

    for (let i = 0; i < matches.length; i++) {
      let home = changeIntoBye(matches[i][0], participantsCount);
      let away = changeIntoBye(sum - matches[i][0], participantsCount);
      roundMatches.push([home, away]);

      home = changeIntoBye(sum - matches[i][1], participantsCount);
      away = changeIntoBye(matches[i][1], participantsCount);
      roundMatches.push([home, away]);
    }
    matches = roundMatches;
  }

  return matches;
}

function changeIntoBye(seed: number, playerCount: number) {
  return seed <= playerCount ? seed : -1;
}

export async function GET(request: Request, { params }: Params) {
  const token = await getSession();
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (token.value.role !== "admin") {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (
    !params.tournamentId ||
    Array.isArray(params.tournamentId) ||
    params.tournamentId == "" ||
    !params.currentId ||
    Array.isArray(params.currentId) ||
    params.currentId == ""
  ) {
    return new Response(`Error fetching tournament players`, {
      status: 400,
    });
  }

  const tid = Number(params.tournamentId);
  const target = Number(params.currentId);

  if (!Number.isSafeInteger(tid) || !Number.isSafeInteger(target)) {
    return new Response(`Error fetching tournament players`, {
      status: 400,
    });
  }

  const status = await getTournamentPlayers(tid);

  if (!status.success) {
    return new Response(status.error, {
      status: 400,
    });
  }

  status.value = status.value.sort((a, b) => {
    const aWinRate = winPercentage(a);
    const bWinRate = winPercentage(b);

    if (aWinRate < bWinRate) {
      return 1;
    } else if (aWinRate > bWinRate) {
      return -1;
    } else {
      return 0;
    }
  });

  const res = seeding(status.value)
    .map((seeds, i) => {
      let p1 = status.value[seeds[0] - 1] ?? null;
      let p2 = status.value[seeds[1] - 1] ?? null;

      if (p1) {
        // Remove old matches and set new tournament id
        p1.player.tournament_id = target;
        p1.player.bracket_match = i + 1;
        p1.player.bracket_seed = seeds[0];
        p1.matches = [];
      }
      //
      if (p2) {
        //   // Remove old matches and set new tournament id
        p2.player.tournament_id = target;
        p2.player.bracket_match = i + 1;
        p2.player.bracket_seed = seeds[1];
        p2.matches = [];
      }

      return [p1, p2];
    })
    .flat();

  const added = await addPlayers(res);

  if (!added.success) {
    return new Response(added.error, {
      status: 400,
    });
  }

  return new Response(JSON.stringify(res), {
    status: 200,
  });
}
