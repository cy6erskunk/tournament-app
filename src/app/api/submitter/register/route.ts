import { jsonParser } from "@/helpers/jsonParser";
import { registerDevice } from "@/database/registerDevice";

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

  const result = await registerDevice(name);

  if (!result.success) {
    return new Response(result.error, {
      status: 400,
      headers: getCorsHeaders(),
    });
  }

  return new Response(
    JSON.stringify({
      deviceToken: result.value.device_token,
      name: result.value.submitter_name,
      message: "Device registered successfully",
    }),
    {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(),
      },
    },
  );
}
