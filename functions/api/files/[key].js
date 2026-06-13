export async function onRequest(context) {
  const { params, env } = context;
  const key = `pdfs/${params.key}`;

  const object = await env.R2.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${params.key}"`,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
