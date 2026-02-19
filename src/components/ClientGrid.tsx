'use client';

import { Beat } from '@/lib/storage';
import { BeatCard } from './BeatCard';
import { useState, useRef, useEffect } from 'react';

export function ClientGrid({ beats }: { beats: Beat[] }) {
  const [currentBeatId, setCurrentBeatId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setCurrentBeatId(null);
    }
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    }
  }, []);

  const toggleBeat = (beat: Beat) => {
    if (!audioRef.current) return;

    if (currentBeatId === beat.id) {
        if (!audioRef.current.paused) {
            audioRef.current.pause();
            setCurrentBeatId(null);
        } else {
             audioRef.current.play();
        }
    } else {
        audioRef.current.src = beat.audioPath;
        audioRef.current.play();
        setCurrentBeatId(beat.id);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {beats.map(beat => (
            <BeatCard 
                key={beat.id} 
                beat={beat} 
                isPlaying={currentBeatId === beat.id} 
                onToggle={() => toggleBeat(beat)} 
            />
        ))}
        {beats.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4">
                <p className="text-lg">No beats found yet.</p>
                <a href="/admin" className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-300">
                    Go to Admin Upload
                </a>
            </div>
        )}
    </div>
  );
}
