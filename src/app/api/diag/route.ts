// Diagnostic endpoint - public, no auth, remove after debugging
export async function GET() {
  const results: Record<string, string> = {
    node_version: process.version,
    platform: process.platform,
    has_database_url: process.env.DATABASE_URL ? 'YES' : 'NO',
    db_url_prefix: process.env.DATABASE_URL?.split(';')[0] ?? 'NONE',
  };

  try {
    const { PrismaClient } = await import('@prisma/client');
    results.prisma_import = 'OK';
    let client: InstanceType<typeof PrismaClient> | null = null;
    try {
      client = new PrismaClient({ log: ['error'] });
      results.prisma_new = 'OK';
      try {
        await client.$connect();
        results.prisma_connect = 'OK';
        try {
          const count = await client.$queryRaw`SELECT 1 as test`;
          results.prisma_query = `OK: ${JSON.stringify(count)}`;
        } catch (e: unknown) {
          results.prisma_query = String(e instanceof Error ? e.message : e);
        }
      } catch (e: unknown) {
        results.prisma_connect = String(e instanceof Error ? e.message : e);
      } finally {
        await client.$disconnect().catch(() => {});
      }
    } catch (e: unknown) {
      results.prisma_new = String(e instanceof Error ? e.message : e);
    }
  } catch (e: unknown) {
    results.prisma_import = String(e instanceof Error ? e.message : e);
  }

  return Response.json(results, { status: 200 });
}
