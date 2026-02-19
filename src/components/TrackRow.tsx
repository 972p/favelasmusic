"use client";

import { Beat } from "@/lib/storage";
import { useAudioStore } from "@/store/useAudioStore";
import { Play, Pause, Music } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TrackRowProps {
  beat: Beat;
  index: number;
}

export function TrackRow({ beat, index }: TrackRowProps) {
  const { currentBeat, isPlaying, play, pause, setBeat } = useAudioStore();
  
  const isCurrent = currentBeat?.id === beat.id;
  const isCurrentPlaying = isCurrent && isPlaying;

  const handlePlay = () => {
    if (isCurrent) {
      if (isPlaying) pause();
      else play();
    } else {
      setBeat(beat);
      play();
    }
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
            "group relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300",
            "hover:bg-white/5 border border-transparent hover:border-white/5",
            isCurrent ? "bg-white/5 border-white/10" : ""
        )}
    >
        {/* Play Button Overlay / Index */}
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
             <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handlePlay();
                }}
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white text-black opacity-0 scale-90 relative z-10 pointer-events-auto",
                    "group-hover:opacity-100 group-hover:scale-100",
                    isCurrentPlaying ? "opacity-100 scale-100" : ""
                )}
             >
                {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
             </button>
             
             {/* Fallback to index or music note if not hovered/playing */}
             <span className={cn(
                 "absolute text-sm text-zinc-500 font-mono transition-opacity pointer-events-none",
                 "group-hover:opacity-0",
                 isCurrentPlaying ? "opacity-0" : "opacity-100"
             )}>
                {index + 1}
             </span>
        </div>

        {/* Title & Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className={cn(
                "font-medium truncate transition-colors",
                isCurrent ? "text-white" : "text-zinc-300 group-hover:text-white"
            )}>
                {beat.title}
            </h4>
            {beat.description && (
                <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 max-w-[300px]">
                    {beat.description}
                </p>
            )}
        </div>

        {/* Metadata (BPM, Key) - Hidden on small screens, visible on hover/large */}
        <div className="hidden md:flex items-center gap-6 text-xs text-zinc-500 font-mono">
            {beat.bpm && (
                <span className="group-hover:text-zinc-300 transition-colors">
                    {beat.bpm} BPM
                </span>
            )}
            {beat.key && (
                <span className="w-12 text-center py-1 rounded bg-white/5 group-hover:bg-white/10 transition-colors">
                    {beat.key}
                </span>
            )}
        </div>
    </motion.div>
  );
}
