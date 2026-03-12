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

    // Fetch all videos, all active users (non-admin), and all video views in parallel
    const [videos, users, views] = await Promise.all([
      prisma.video.findMany({ orderBy: { videoId: 'asc' } }),
      prisma.user.findMany({
        where: { AND: [{ OR: [{ status: null }, { status: false }] }, { idRole: { not: 1 } }] },
        select: { idUser: true, name: true, lastname: true },
      }),
      prisma.videoView.findMany({
        include: { user: { select: { name: true, lastname: true } } },
      }),
    ]);

    const totalUsers = users.length;

    // Build per-video reports
    const videoReports = videos.map((video) => {
      const videoViews = views.filter((v) => v.videoId === video.videoId);
      const watchers = videoViews.map((v) => ({
        userId: v.userId,
        name: `${v.user.name ?? ''} ${v.user.lastname ?? ''}`.trim(),
        viewedOn: v.viewedOn.toISOString(),
      }));

      return {
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        watchedCount: watchers.length,
        totalUsers,
        completionPercent:
          totalUsers > 0
            ? Math.round((watchers.length / totalUsers) * 1000) / 10
            : 0,
        watchers,
      };
    });

    // Build per-user summaries
    const totalVideos = videos.length;
    const userSummaries = users.map((user) => {
      const watchedCount = views.filter((v) => v.userId === user.idUser).length;
      return {
        userId: user.idUser,
        name: `${user.name ?? ''} ${user.lastname ?? ''}`.trim(),
        watchedCount,
        totalVideos,
      };
    });

    // Overall completion
    const overallCompletion =
      totalUsers > 0 && totalVideos > 0
        ? Math.round(
            (views.length / (totalUsers * totalVideos)) * 1000,
          ) / 10
        : 0;

    return NextResponse.json({
      totalVideos,
      overallCompletion,
      videos: videoReports,
      userSummaries,
    });
  } catch (error) {
    console.error('GET /api/reports/videos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
