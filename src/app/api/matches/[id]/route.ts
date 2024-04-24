import { getSession } from '@/helpers/getsession'
import { Params } from './type'
import { jsonParser } from '@/helpers/jsonParser'
import { Matches } from '@/types/Kysely'
import { deleteMatch } from '@/database/deleteMatch'
import { updateMatch } from '@/database/updateMatch'

export async function GET(request: Request, { params }: Params) {
  // Get the id from the request query
  const id = Number(params.id)

  return new Response(`Hello world, id: ${id}`, { status: 200 })
}

export async function PUT(request: Request, { params }: Params) {
  // Get the id from the request query
  const id = Number(params.id)
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
  const matchResult = await updateMatch(data.value, id);

  if (!matchResult.success) {
    return new Response(`Error adding match: ${matchResult.error}`, {
      status: 400,
    });
  }

  return new Response(JSON.stringify(matchResult.value));
}

export async function DELETE(request: Request, { params }: Params) {
  // Get the id from the request query
  const id = Number(params.id)

  const token = await getSession()
  if (!token.success) {
    return new Response(`Unauthorized access`, {
      status: 403
    })
  }

  // add match to matches table
  const matchResult = await deleteMatch(id);

  if (!matchResult.success) {
    return new Response(`Error adding match: ${matchResult.error}`, {
      status: 400,
    });
  }

  return new Response(JSON.stringify(matchResult.value));
}
