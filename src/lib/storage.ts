import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const BEATS_FILE = path.join(DATA_DIR, 'beats.json');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');

export interface Beat {
  id: string;
  title: string;
  bpm: number;
  key: string;
  coverPath: string;
  audioPath: string;
  description?: string;
  createdAt: string;

  // New properties for interactions and sales
  likeCount?: number;
  dislikeCount?: number;
  forSale?: boolean;
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
  profilePicture: string;
  banner?: string;
  backgroundImage?: string;
  backgroundBlur?: number;
  socials: Socials;
}

// Beats Management
export function getBeats(): Beat[] {
  if (!fs.existsSync(BEATS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(BEATS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
}

export function addBeat(beat: Beat) {
  const beats = getBeats();

  // Initialize counts
  const newBeat = {
    ...beat,
    likeCount: beat.likeCount || 0,
    dislikeCount: beat.dislikeCount || 0
  };

  beats.push(newBeat);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BEATS_FILE, JSON.stringify(beats, null, 2));
}

export function updateBeat(id: string, updates: Partial<Beat>): Beat | null {
  const beats = getBeats();
  const beatIndex = beats.findIndex(b => b.id === id);

  if (beatIndex === -1) return null;

  // Apply updates
  const updatedBeat = { ...beats[beatIndex], ...updates };
  beats[beatIndex] = updatedBeat;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(BEATS_FILE, JSON.stringify(beats, null, 2));

  return updatedBeat;
}

// Profile Management
const defaultProfile: Profile = {
  pseudo: 'Beatmaker',
  tagline: 'Producer',
  profilePicture: '',
  socials: {}
};

export function getProfile(): Profile {
  if (!fs.existsSync(PROFILE_FILE)) {
    return defaultProfile;
  }
  try {
    return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf-8'));
  } catch (e) {
    return defaultProfile;
  }
}

export function updateProfile(newProfile: Partial<Profile>) {
  const current = getProfile();
  const updated = { ...current, ...newProfile };
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROFILE_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

export function deleteBeat(id: string) {
  const beats = getBeats();
  const beatIndex = beats.findIndex(b => b.id === id);

  if (beatIndex === -1) return false;

  const beat = beats[beatIndex];

  // Delete files
  try {
    // Helper to delete file if it exists and is within public/uploads
    const deleteFile = (relativePath: string) => {
      if (!relativePath.startsWith('/uploads/')) return; // Safety check
      const fullPath = path.join(process.cwd(), 'public', relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    };

    if (beat.audioPath) deleteFile(beat.audioPath);
    if (beat.coverPath) deleteFile(beat.coverPath);

  } catch (error) {
    console.error('Error deleting files for beat:', beat.id, error);
  }

  beats.splice(beatIndex, 1);
  fs.writeFileSync(BEATS_FILE, JSON.stringify(beats, null, 2));
  return true;
}
