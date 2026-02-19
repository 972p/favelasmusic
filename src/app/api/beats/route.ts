import { NextRequest, NextResponse } from 'next/server';
import { addBeat, getBeats, Beat } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export async function GET() {
  const beats = getBeats();
  return NextResponse.json(beats);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const coverFile = formData.get('cover') as File;
    const title = formData.get('title') as string;
    const bpm = formData.get('bpm') as string;
    const key = formData.get('key') as string;

    // Sanitize filename: separate extension, sanitize base name
    const sanitize = (originalName: string) => {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, '-');
        return `${sanitizedName}${ext}`;
    };

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioFileName = `${Date.now()}-${sanitize(audioFile.name)}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    
    // Ensure directory exists (redundant check but safe)
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const audioPath = path.join(uploadDir, audioFileName);
    fs.writeFileSync(audioPath, audioBuffer);

    let coverPath = '';
    if (coverFile) {
      const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
      const coverFileName = `${Date.now()}-${sanitize(coverFile.name)}`;
      const coverFilePath = path.join(uploadDir, coverFileName);
      fs.writeFileSync(coverFilePath, coverBuffer);
      coverPath = `/uploads/${coverFileName}`;
    }

    const newBeat: Beat = {
      id: crypto.randomUUID(),
      title,
      bpm: parseInt(bpm) || 0,
      key: key || '',
      coverPath,
      audioPath: `/uploads/${audioFileName}`,
      description: formData.get('description') as string || '',
      createdAt: new Date().toISOString()
    };

    addBeat(newBeat);
    return NextResponse.json(newBeat);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
