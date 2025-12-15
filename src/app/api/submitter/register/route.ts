import { jsonParser } from "@/helpers/jsonParser";
import { generateMatchId } from "@/helpers/generateMatchId";
import { db } from "@/database/database";

interface RegisterRequest {
  name: string;
}

function getCorsHeaders() {
  const isDev = process.env.NODE_ENV === 'development';
  const allowedOrigin = isDev ? '*' : process.env.CORS_ALLOWED_ORIGIN || '';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}

export async function POST(request: Request) {
  const json = await request.text();
  const data = jsonParser<RegisterRequest>(json);

  if (!data.success) {
    return new Response(`Error reading registration data`, {
      status: 400,
      headers: getCorsHeaders(),
    });
  }

  const { name } = data.value;

  if (!name || name.trim().length === 0) {
    return new Response(`Name is required`, {
      status: 400,
      headers: getCorsHeaders(),
    });
  }

  if (name.length > 255) {
    return new Response(`Name must be 255 characters or less`, {
      status: 400,
      headers: getCorsHeaders(),
    });
  }

  try {
    // Generate a unique device token
    const deviceToken = generateMatchId(); // Reuse secure random generation

    // Insert into database
    await db
      .insertInto('submitter_devices')
      .values({
        device_token: deviceToken,
        submitter_name: name.trim(),
        created_at: new Date(),
      })
      .execute();

    return new Response(JSON.stringify({
      deviceToken,
      name: name.trim(),
      message: "Device registered successfully"
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(),
      },
    });
  } catch (error) {
    console.error('Error registering device:', error);
    return new Response(`Error registering device`, {
      status: 500,
      headers: getCorsHeaders(),
    });
  }
}
