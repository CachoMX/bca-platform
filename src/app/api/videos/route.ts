import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;

    const videos = await prisma.video.findMany({
      include: {
        views: {
          where: { userId },
          select: { id: true, viewedOn: true },
        },
      },
      orderBy: { videoId: 'asc' },
    });

    const result = videos.map((video) => ({
      id: video.videoId,
      title: video.videoTitle,
      url: video.videoFilePath ?? '',
      watched: video.views.length > 0,
      watchedAt: video.views.length > 0 ? video.views[0].viewedOn : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/videos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
