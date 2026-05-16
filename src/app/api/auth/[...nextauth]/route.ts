async function safeHandler(req: Request, ctx: unknown) {
  try {
    const { handlers } = await import('@/lib/auth');
    const handler = req.method === 'POST' ? handlers.POST : handlers.GET;
    return await handler(req, ctx as never);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.stack ?? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export const GET = safeHandler;
export const POST = safeHandler;
