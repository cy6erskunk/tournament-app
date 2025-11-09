import { addMatch } from "@/database/addMatch";
import { deleteMatch } from "@/database/deleteMatch";
import { updateMatch } from "@/database/updateMatch";
import { getSession } from "@/helpers/getsession";
import { jsonParser } from "@/helpers/jsonParser";
import { NewMatch } from "@/types/MatchTypes";

export async function POST(request: Request) {
  const json = await request.text();
  const data = jsonParser<NewMatch>(json);

  const token = await getSession();
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (!data.success) {
    return new Response(`Error reading match`, {
      status: 400,
    });
  }

  if (data.value.winner === null) {
    return new Response(`Winner cannot be null`, {
      status: 400,
    });
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

export async function GET(request: Request) {
  // Get the id from the request query

  return new Response(`Hello world`, { status: 200 });
}

export async function PUT(request: Request) {
  // Get the id from the request query
  const json = await request.text();
  const data = jsonParser<NewMatch>(json);

  const token = await getSession();
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (!data.success) {
    return new Response(`Error reading match`, {
      status: 400,
    });
  }

  if (data.value.winner === null) {
    return new Response(`Winner cannot be null`, {
      status: 400,
    });
  }

  // add match to matches table
  const matchResult = await updateMatch(data.value);
  if (!matchResult.success) {
    return new Response(`Error updating match: ${matchResult.error}`, {
      status: 400,
    });
  }

  return new Response(JSON.stringify(matchResult.value));
}

export async function DELETE(request: Request) {
  // Get the id from the request query
  const json = await request.text();
  const data = jsonParser<NewMatch>(json);

  const token = await getSession();
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403,
    });
  }

  if (!data.success) {
    return new Response(`Error reading match`, {
      status: 400,
    });
  }

  if (data.value.winner === null) {
    return new Response(`Winner cannot be null`, {
      status: 400,
    });
  }

  // add match to matches table
  const matchResult = await deleteMatch(data.value);

  if (!matchResult.success) {
    return new Response(`Error deleting match: ${matchResult.error}`, {
      status: 400,
    });
  }

  return new Response(JSON.stringify(matchResult.value));
}
