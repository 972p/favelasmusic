"use client";

import { Beat } from "@/lib/storage";
import { useAudioStore } from "@/store/useAudioStore";
import { Play, Pause, ThumbsUp, ThumbsDown, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInteractionStore } from "@/store/useInteractionStore";

interface TrackRowProps {
    beat: Beat;
    index: number;
}

export function TrackRow({ beat, index }: TrackRowProps) {
    const { currentBeat, isPlaying, play, pause, setBeat } = useAudioStore();
    const { interactions, sessionLikes, sessionDislikes, toggleLike, toggleDislike } = useInteractionStore();

    const isCurrent = currentBeat?.id === beat.id;
    const isCurrentPlaying = isCurrent && isPlaying;
    const interaction = interactions[beat.id];
    const optLike = sessionLikes[beat.id] || 0;
    const optDislike = sessionDislikes[beat.id] || 0;

    const handlePlay = () => {
        if (isCurrent) {
            if (isPlaying) pause();
            else play();
        } else {
            setBeat(beat);
            play();
        }
    };

    const handleCheckout = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = encodeURIComponent(`Salut ! Je suis intéressé par la prod "${beat.title}"`);
        window.open(`https://twitter.com/messages/compose?text=${text}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={handlePlay}
            className={cn(
                "group relative flex items-center gap-3 sm:gap-4 p-3 rounded-xl transition-all duration-300 cursor-pointer",
                "hover:bg-white/5 border border-transparent hover:border-white/5",
                isCurrent ? "bg-white/5 border-white/10" : ""
            )}
        >
            {/* Play Button / Index */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0 relative">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white text-black opacity-0 scale-90 relative z-10 pointer-events-auto",
                        "group-hover:opacity-100 group-hover:scale-100",
                        isCurrentPlaying ? "opacity-100 scale-100" : ""
                    )}
                >
                    {isCurrentPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <span className={cn(
                    "absolute text-sm text-zinc-500 font-mono transition-opacity pointer-events-none",
                    "group-hover:opacity-0",
                    isCurrentPlaying ? "opacity-0" : "opacity-100"
                )}>
                    {index + 1}
                </span>
            </div>

            {/* Title, Description & Mobile Badges */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={cn(
                        "font-medium truncate transition-colors",
                        isCurrent ? "text-white" : "text-zinc-300 group-hover:text-white"
                    )}>
                        {beat.title}
                    </h4>
                    {beat.forSale && beat.price !== undefined && (
                        <button
                            onClick={handleCheckout}
                            className="md:hidden px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black transition-colors"
                        >
                            €{beat.price.toFixed(2)}
                        </button>
                    )}
                </div>

                {beat.description && (
                    <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 max-w-[300px]">
                        {beat.description}
                    </p>
                )}

                {/* Mobile BPM/Key badges */}
                <div className="flex sm:hidden items-center gap-1.5 mt-1 flex-wrap">
                    {beat.bpm > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono text-zinc-500">
                            {beat.bpm} BPM
                        </span>
                    )}
                    {beat.key && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono text-zinc-500">
                            {beat.key}
                        </span>
                    )}
                </div>
            </div>

            {/* Desktop: Metadata + Interactions */}
            <div className="hidden sm:flex items-center gap-4 md:gap-6 text-xs text-zinc-500 font-mono">
                {beat.forSale && beat.price !== undefined && (
                    <button
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white text-white hover:text-black rounded transition-all duration-300 font-sans text-xs font-bold uppercase tracking-wider"
                        onClick={handleCheckout}
                        title="Acheter"
                    >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        €{beat.price.toFixed(2)}
                    </button>
                )}

                {/* Interaction Buttons */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(beat.id); }}
                        className={cn(
                            "flex items-center gap-1 p-1.5 px-2 rounded-full transition-colors",
                            interaction === 'like' ? 'text-green-400 bg-green-400/10 opacity-100' : 'text-zinc-500 hover:text-green-400 hover:bg-white/5'
                        )}
                        style={{ opacity: interaction ? 1 : undefined }}
                        title="Like"
                    >
                        <ThumbsUp className={`w-3.5 h-3.5 ${interaction === 'like' ? 'fill-current' : ''}`} />
                        <span>{Math.max(0, (beat.likeCount || 0) + optLike)}</span>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleDislike(beat.id); }}
                        className={cn(
                            "flex items-center gap-1 p-1.5 px-2 rounded-full transition-colors",
                            interaction === 'dislike' ? 'text-red-400 bg-red-400/10 opacity-100' : 'text-zinc-500 hover:text-red-400 hover:bg-white/5'
                        )}
                        style={{ opacity: interaction ? 1 : undefined }}
                        title="Dislike"
                    >
                        <ThumbsDown className={`w-3.5 h-3.5 ${interaction === 'dislike' ? 'fill-current' : ''}`} />
                        <span>{Math.max(0, (beat.dislikeCount || 0) + optDislike)}</span>
                    </button>
                </div>

                {beat.bpm && (
                    <span className="group-hover:text-zinc-300 transition-colors w-16 text-right hidden md:block">
                        {beat.bpm} BPM
                    </span>
                )}
                {beat.key && (
                    <span className="w-16 text-center py-1 rounded bg-white/5 group-hover:bg-white/10 transition-colors hidden md:inline-block">
                        {beat.key}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
