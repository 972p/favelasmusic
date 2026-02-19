import { NextRequest, NextResponse } from 'next/server';
import { deleteBeat } from '@/lib/storage';

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
