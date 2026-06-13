function auth(request, env) {
  const header = request.headers.get('Authorization') || '';
  return header === `Bearer ${env.ADMIN_PASSWORD}`;
}

function uuid() {
  return crypto.randomUUID();
}

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // GET — public, no auth required
  if (method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT * FROM entries ORDER BY created_at DESC'
    ).all();
    return new Response(JSON.stringify(results), { headers });
  }

  // POST and DELETE require auth
  if (!auth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }

  if (method === 'POST') {
    const body = await request.json();
    const { title, author, type, summary, body: content, url, pdf_key, tags } = body;

    if (!title || !author || !type || !summary) {
      return new Response(JSON.stringify({ error: 'title, author, type, and summary are required' }), { status: 400, headers });
    }

    const id = uuid();
    const created_at = new Date().toISOString();
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');

    await env.DB.prepare(
      'INSERT INTO entries (id, title, author, type, summary, body, url, pdf_key, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, title, author, type, summary, content || null, url || null, pdf_key || null, tagsStr, created_at).run();

    return new Response(JSON.stringify({ id }), { status: 201, headers });
  }

  if (method === 'DELETE') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers });
    }

    // If the entry has a PDF, delete it from R2 too
    const row = await env.DB.prepare('SELECT pdf_key FROM entries WHERE id = ?').bind(id).first();
    if (row?.pdf_key) {
      await env.R2.delete(row.pdf_key);
    }

    await env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}
