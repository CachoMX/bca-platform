import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { userId: number }).userId;

    const { id } = await params;
    const videoId = Number(id);
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    // Verify video exists
    const video = await prisma.video.findUnique({ where: { videoId } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if already watched
    const existingView = await prisma.videoView.findFirst({
      where: { userId, videoId },
    });

    if (existingView) {
      return NextResponse.json(existingView);
    }

    const view = await prisma.videoView.create({
      data: {
        userId,
        videoId,
        viewedOn: new Date(),
      },
    });

    return NextResponse.json(view, { status: 201 });
  } catch (error) {
    console.error('POST /api/videos/[id]/watch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
