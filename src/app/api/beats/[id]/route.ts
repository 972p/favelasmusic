import { NextRequest, NextResponse } from 'next/server';
import { deleteBeat, updateBeat } from '@/lib/storage';
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Beat ID required' }, { status: 400 });
  const success = deleteBeat(id);
  if (success) return NextResponse.json({ success: true });
  return NextResponse.json({ error: 'Beat not found' }, { status: 404 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Beat ID required' }, { status: 400 });

  try {
    const contentType = request.headers.get('content-type') || '';

    // ── Metadata + optional cover (FormData) ────────────────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();

      const updates: Record<string, unknown> = {};

      const title = formData.get('title') as string | null;
      const description = formData.get('description') as string | null;
      const bpm = formData.get('bpm') as string | null;
      const key = formData.get('key') as string | null;
      const forSale = formData.get('forSale') as string | null;
      const price = formData.get('price') as string | null;
      const coverFile = formData.get('cover') as File | null;

      if (title !== null) updates.title = title;
      if (description !== null) updates.description = description;
      if (bpm !== null) updates.bpm = parseInt(bpm, 10) || 0;
      if (key !== null) updates.key = key;
      if (forSale !== null) updates.forSale = forSale === 'true';
      if (price !== null) updates.price = parseFloat(price) || 0;

      // Handle new cover upload
      if (coverFile && coverFile.size > 0) {
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const filename = `cover_${id}_${Date.now()}.${ext}`;
        const destPath = path.join(UPLOADS_DIR, filename);
        if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        const buffer = Buffer.from(await coverFile.arrayBuffer());
        fs.writeFileSync(destPath, buffer);
        updates.coverPath = `/uploads/${filename}`;
      }

      const updated = updateBeat(id, updates);
      if (updated) return NextResponse.json(updated);
      return NextResponse.json({ error: 'Beat not found' }, { status: 404 });
    }

    // ── Like/Dislike only (JSON) ────────────────────────────────────────────
    const body = await request.json();
    const { likeDelta, dislikeDelta } = body;

    const beats: any[] = (() => {
      const file = path.join(process.cwd(), 'data', 'beats.json');
      if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
      return [];
    })();

    const beatIndex = beats.findIndex((b: any) => b.id === id);
    if (beatIndex === -1) return NextResponse.json({ error: 'Beat not found' }, { status: 404 });

    const cur = beats[beatIndex];
    const newLikeCount = Math.max(0, (cur.likeCount || 0) + (likeDelta || 0));
    const newDislikeCount = Math.max(0, (cur.dislikeCount || 0) + (dislikeDelta || 0));

    const updated = updateBeat(id, { likeCount: newLikeCount, dislikeCount: newDislikeCount });
    if (updated) return NextResponse.json(updated);
    return NextResponse.json({ error: 'Failed to update beat' }, { status: 500 });

  } catch (error) {
    console.error('Error in PATCH /api/beats/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
