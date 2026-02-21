import { NextRequest, NextResponse } from 'next/server';
import { getComments, addComment } from '@/lib/storage';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const comments = await getComments(id);
    return NextResponse.json(comments);
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { author, content } = await req.json();
        if (!author?.trim() || !content?.trim()) {
            return NextResponse.json({ error: 'Pseudo et commentaire requis' }, { status: 400 });
        }
        const comment = await addComment(id, author.trim(), content.trim());
        if (!comment) {
            return NextResponse.json({ error: 'Erreur lors de la création du commentaire' }, { status: 500 });
        }
        return NextResponse.json(comment, { status: 201 });
    } catch (e) {
        console.error('POST comments error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
