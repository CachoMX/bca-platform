import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role: number }).role;
    if (role !== 1 && role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [videos, users, allViews] = await Promise.all([
      prisma.video.findMany({
        include: {
          views: {
            include: {
              user: { select: { idUser: true, name: true, lastname: true } },
            },
          },
        },
        orderBy: { videoId: 'asc' },
      }),
      prisma.user.findMany({
        where: { OR: [{ status: null }, { status: false }] },
        select: { idUser: true, name: true, lastname: true },
      }),
      prisma.videoView.findMany(),
    ]);

    const totalVideos = videos.length;

    // Per-video report: how many users watched, who watched with date
    const videoReports = videos.map((video) => ({
      videoId: video.videoId,
      videoTitle: video.videoTitle,
      watchedCount: video.views.length,
      totalUsers: users.length,
      watchers: video.views.map((view) => ({
        idUser: view.user.idUser,
        name: `${view.user.name} ${view.user.lastname}`,
        viewedOn: view.viewedOn,
      })),
    }));

    // Per-user report: how many videos each user has watched
    const viewsByUser = new Map<number, number>();
    for (const view of allViews) {
      viewsByUser.set(view.userId, (viewsByUser.get(view.userId) || 0) + 1);
    }

    const userReports = users.map((user) => ({
      idUser: user.idUser,
      name: `${user.name} ${user.lastname}`,
      watchedCount: viewsByUser.get(user.idUser) || 0,
      totalVideos,
    }));

    return NextResponse.json({
      videoReports,
      userReports,
    });
  } catch (error) {
    console.error('GET /api/videos/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
