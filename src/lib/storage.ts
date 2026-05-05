import { supabase, BUCKET } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Beat {
  id: string;
  title: string;
  bpm: number;
  key: string;
  cover_path: string;   // public URL
  audio_path: string;   // public URL
  description?: string;
  created_at: string;
  like_count: number;
  dislike_count: number;
  for_sale: boolean;
  price?: number;
}

export interface Socials {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  email?: string;
}

export interface Profile {
  pseudo: string;
  tagline: string;
  profile_picture?: string;
  banner?: string;
  background_image?: string;
  background_blur?: number;
  socials: Socials;
}

// ─── File upload helper ───────────────────────────────────────────────────────

/**
 * Upload a File to Supabase Storage and return its public URL.
 * @param file   The browser File / Node Buffer-backed File object
 * @param folder Subfolder inside the bucket (e.g. "audio", "covers", "profile")
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const filename = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage given its public URL.
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  // Extract path after the bucket name
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // Not a storage URL, skip
  const storagePath = publicUrl.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

// ─── Beats ────────────────────────────────────────────────────────────────────

export async function getBeats(): Promise<Beat[]> {
  const { data, error } = await supabase
    .from('beats')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error('getBeats error:', error); return []; }
  return data as Beat[];
}

export async function addBeat(beat: Omit<Beat, 'created_at'>): Promise<Beat | null> {
  const { data, error } = await supabase
    .from('beats')
    .insert({ ...beat, created_at: new Date().toISOString() })
    .select()
    .single();
  if (error) { console.error('addBeat error:', error); return null; }
  return data as Beat;
}

export async function updateBeat(id: string, updates: Partial<Beat>): Promise<Beat | null> {
  const { data, error } = await supabase
    .from('beats')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('updateBeat error:', error); return null; }
  return data as Beat;
}

export async function getBeat(id: string): Promise<Beat | null> {
  const { data, error } = await supabase
    .from('beats')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as Beat;
}

export async function deleteBeat(id: string): Promise<boolean> {
  // Fetch first to delete files from storage
  const beat = await getBeat(id);
  if (!beat) return false;

  if (beat.audio_path) await deleteFile(beat.audio_path);
  if (beat.cover_path) await deleteFile(beat.cover_path);

  const { error } = await supabase.from('beats').delete().eq('id', id);
  if (error) { console.error('deleteBeat error:', error); return false; }
  return true;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: Profile = {
  pseudo: 'Beatmaker',
  tagline: 'Producer',
  socials: {},
};

export async function getProfile(): Promise<Profile> {
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('id', 1)
    .single();
  if (error || !data) return DEFAULT_PROFILE;
  return {
    pseudo: data.pseudo,
    tagline: data.tagline,
    profile_picture: data.profile_picture || undefined,
    banner: data.banner || undefined,
    background_image: data.background_image || undefined,
    background_blur: data.background_blur,
    socials: data.socials || {},
  };
}

export async function updateProfile(updates: Partial<Profile>): Promise<Profile> {
  const mapRow = (row: Record<string, unknown>): Profile => ({
    pseudo: (row.pseudo as string) ?? DEFAULT_PROFILE.pseudo,
    tagline: (row.tagline as string) ?? DEFAULT_PROFILE.tagline,
    profile_picture: (row.profile_picture as string) || undefined,
    banner: (row.banner as string) || undefined,
    background_image: (row.background_image as string) || undefined,
    background_blur: row.background_blur as number | undefined,
    socials: (row.socials as Profile['socials']) || {},
  });

  try {
    // Upsert: insert if id=1 doesn't exist, update if it does
    const { data, error } = await supabase
      .from('profile')
      .upsert({ id: 1, ...updates }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('updateProfile upsert error:', error.code, error.message);
      return DEFAULT_PROFILE;
    }
    if (!data) {
      console.error('updateProfile: upsert returned no data');
      return DEFAULT_PROFILE;
    }
    return mapRow(data);
  } catch (err) {
    console.error('updateProfile exception:', err);
    return DEFAULT_PROFILE;
  }
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  beat_id: string;
  author: string;
  content: string;
  created_at: string;
}

export async function getComments(beatId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('beat_id', beatId)
    .order('created_at', { ascending: true });
  if (error) { console.error('getComments error:', error); return []; }
  return data as Comment[];
}

export async function addComment(
  beatId: string,
  author: string,
  content: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ beat_id: beatId, author, content })
    .select()
    .single();
  if (error) { console.error('addComment error:', error); return null; }
  return data as Comment;
}
