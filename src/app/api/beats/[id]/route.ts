import { NextRequest, NextResponse } from 'next/server';
import { deleteBeat, getBeat, updateBeat, uploadFile, deleteFile } from '@/lib/storage';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Beat ID required' }, { status: 400 });
  const success = await deleteBeat(id);
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

    // ── Metadata + optional cover (FormData) ───────────────────────────────
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
      if (forSale !== null) updates.for_sale = forSale === 'true';
      if (price !== null) updates.price = parseFloat(price) || 0;

      // Handle new cover upload
      if (coverFile && coverFile.size > 0) {
        // Delete old cover from storage
        const existing = await getBeat(id);
        if (existing?.cover_path) await deleteFile(existing.cover_path);
        updates.cover_path = await uploadFile(coverFile, 'covers');
      }

      const updated = await updateBeat(id, updates);
      if (updated) return NextResponse.json(updated);
      return NextResponse.json({ error: 'Beat not found' }, { status: 404 });
    }

    // ── Like / Dislike only (JSON) ─────────────────────────────────────────
    const body = await request.json();
    const { likeDelta = 0, dislikeDelta = 0 } = body;

    const beat = await getBeat(id);
    if (!beat) return NextResponse.json({ error: 'Beat not found' }, { status: 404 });

    const updated = await updateBeat(id, {
      like_count: Math.max(0, (beat.like_count || 0) + likeDelta),
      dislike_count: Math.max(0, (beat.dislike_count || 0) + dislikeDelta),
    });

    if (updated) return NextResponse.json(updated);
    return NextResponse.json({ error: 'Failed to update beat' }, { status: 500 });

  } catch (error) {
    console.error('Error in PATCH /api/beats/[id]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
