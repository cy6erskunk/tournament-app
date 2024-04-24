import { addMatch } from "@/database/addMatch";
import { Matches } from "@/types/Kysely";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";

export async function POST(request: Request) {
  const json = await request.text()
  const data = jsonParser<Matches>(json)

  const token = await getSession()
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403
    })
  }

  if (!data.success) {
    return new Response(`Error reading match`, {
      status: 400
    })
  }

  // add match to matches table
  const matchResult = await addMatch(data.value);

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
