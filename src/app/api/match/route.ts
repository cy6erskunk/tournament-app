import { addMatch } from "@/database/addMatch";
import { Matches } from "@/database/types";

// add new match
export async function POST(request: Request) {
  const form: Matches = await request.json();
  // const form = req.formData;
  // const round = req.round;

  // add match to matches table
  const matchResult = await addMatch(form);

  if (!matchResult.success) {
    let status = 400;

    // Unique key violation (Duplicate entry)
    if (matchResult.error.code === 23505) {
      status = 409;
    }

    return new Response(`Error adding match: ${matchResult.error}`, {
      status: status,
    });
  }

  return new Response(JSON.stringify(matchResult.value));
}
