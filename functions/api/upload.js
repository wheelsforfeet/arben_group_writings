function auth(request, env) {
  const header = request.headers.get('Authorization') || '';
  return header === `Bearer ${env.ADMIN_PASSWORD}`;
}

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  if (!auth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400, headers });
  }

  if (file.type !== 'application/pdf') {
    return new Response(JSON.stringify({ error: 'Only PDF files are accepted' }), { status: 400, headers });
  }

  const key = `pdfs/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await env.R2.put(key, file.stream(), {
    httpMetadata: { contentType: 'application/pdf' },
  });

  return new Response(JSON.stringify({ key }), { status: 201, headers });
}
