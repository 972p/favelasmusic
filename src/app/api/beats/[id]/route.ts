import { NextRequest, NextResponse } from 'next/server';
import { deleteBeat, updateBeat } from '@/lib/storage';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Beat ID required' }, { status: 400 });
  }

  const success = deleteBeat(id);

  if (success) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: 'Beat not found' }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Beat ID required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { likeDelta, dislikeDelta } = body;

    const fs = require('fs');
    const path = require('path');
    const BEATS_FILE = path.join(process.cwd(), 'data', 'beats.json');
    let beats = [];
    if (fs.existsSync(BEATS_FILE)) {
      beats = JSON.parse(fs.readFileSync(BEATS_FILE, 'utf-8'));
    }

    const beatIndex = beats.findIndex((b: any) => b.id === id);
    if (beatIndex === -1) {
      return NextResponse.json({ error: 'Beat not found' }, { status: 404 });
    }

    const currentBeat = beats[beatIndex];
    let newLikeCount = (currentBeat.likeCount || 0) + (likeDelta || 0);
    let newDislikeCount = (currentBeat.dislikeCount || 0) + (dislikeDelta || 0);

    // Prevent negative counts
    if (newLikeCount < 0) newLikeCount = 0;
    if (newDislikeCount < 0) newDislikeCount = 0;

    const updatedBeat = updateBeat(id, {
      likeCount: newLikeCount,
      dislikeCount: newDislikeCount
    });

    if (updatedBeat) {
      return NextResponse.json(updatedBeat);
    } else {
      return NextResponse.json({ error: 'Failed to update beat' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating beat:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
