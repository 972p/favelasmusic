'use client';

import { Beat } from '@/lib/storage';
import { Play, Pause, Download } from 'lucide-react';
import Image from 'next/image';

interface BeatCardProps {
  beat: Beat;
  isPlaying: boolean;
  onToggle: () => void;
}

export function BeatCard({ beat, isPlaying, onToggle }: BeatCardProps) {
  return (
    <div className="group relative bg-white/5 border border-white/5 rounded-xl overflow-hidden hover:bg-white/10 hover:border-white/10 transition-all duration-300 backdrop-blur-sm">
      <div className="aspect-square relative flex items-center justify-center bg-zinc-900 overflow-hidden">
        {beat.coverPath ? (
           <Image 
             src={beat.coverPath} 
             alt={beat.title} 
             fill 
             className={`object-cover transition-transform duration-500 ${isPlaying ? 'scale-105' : 'group-hover:scale-105'}`} 
           />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-zinc-800 bg-zinc-950">
             <span className="text-4xl font-thin opacity-20">X</span>
           </div>
        )}
        
        {/* Play Overlay */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <button 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-xl"
            >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
            </button>
        </div>

        {/* Download Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-[-10px] group-hover:translate-y-0">
            <a 
                href={beat.audioPath} 
                download 
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 bg-black/60 hover:bg-white hover:text-black text-white rounded-full transition-all flex items-center justify-center backdrop-blur-md"
                title="Download Beat"
            >
                <Download className="w-4 h-4" />
            </a>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-base text-zinc-100 truncate group-hover:text-white transition-colors">{beat.title}</h3>
        <div className="flex justify-between items-center mt-2 text-xs font-medium text-zinc-400">
            <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">{beat.bpm} BPM</span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5">{beat.key}</span>
            </div>
        </div>
      </div>
      
      {/* Active Indicator */}
      {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
      )}
    </div>
  );
}
