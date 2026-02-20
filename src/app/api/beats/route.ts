import { NextRequest, NextResponse } from 'next/server';
import { getBeats, addBeat, uploadFile } from '@/lib/storage';

export async function GET() {
  const beats = await getBeats();
  return NextResponse.json(beats);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const coverFile = formData.get('cover') as File | null;
    const title = formData.get('title') as string;
    const bpm = formData.get('bpm') as string;
    const key = formData.get('key') as string;
    const description = (formData.get('description') as string) || '';
    const forSale = formData.get('forSale') === 'true';
    const priceStr = formData.get('price') as string;
    const price = priceStr ? parseFloat(priceStr) : undefined;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
    }

    // Upload audio to Supabase Storage
    const audioUrl = await uploadFile(audioFile, 'audio');

    // Upload cover if provided
    let coverUrl = '';
    if (coverFile && coverFile.size > 0) {
      coverUrl = await uploadFile(coverFile, 'covers');
    }

    const newBeat = await addBeat({
      id: crypto.randomUUID(),
      title,
      bpm: parseInt(bpm) || 0,
      key: key || '',
      cover_path: coverUrl,
      audio_path: audioUrl,
      description,
      like_count: 0,
      dislike_count: 0,
      for_sale: forSale,
      price: forSale ? price : undefined,
    });

    return NextResponse.json(newBeat);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
