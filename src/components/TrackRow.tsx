"use client";

import { Beat } from "@/lib/storage";
import { useAudioStore } from "@/store/useAudioStore";
import { Play, Pause, ThumbsUp, ThumbsDown, ShoppingCart, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInteractionStore } from "@/store/useInteractionStore";
import Image from "next/image";
import { useState } from "react";
import { CommentSection } from "@/components/CommentSection";

interface TrackRowProps {
    beat: Beat;
    index: number;
}

/** Spinning vinyl disc shown when no cover is provided */
function VinylDisc({ spinning }: { spinning: boolean }) {
    return (
        <div className="relative w-10 h-10 shrink-0">
            {/* Outer disc */}
            <motion.div
                animate={{ rotate: spinning ? 360 : 0 }}
                transition={
                    spinning
                        ? { repeat: Infinity, duration: 2, ease: "linear" }
                        : { duration: 0.4 }
                }
                className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 via-zinc-900 to-zinc-800 border border-white/10 flex items-center justify-center shadow-lg"
                style={{
                    background:
                        "conic-gradient(from 0deg, #27272a, #3f3f46, #18181b, #3f3f46, #27272a)",
                }}
            >
                {/* Grooves */}
                <div className="w-7 h-7 rounded-full border border-white/5 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border border-white/5 flex items-center justify-center">
                        {/* Centre hole */}
                        <div className="w-2 h-2 rounded-full bg-zinc-950 border border-white/10" />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export function TrackRow({ beat, index }: TrackRowProps) {
    const { currentBeat, isPlaying, play, pause, setBeat } = useAudioStore();
    const { interactions, sessionLikes, sessionDislikes, toggleLike, toggleDislike } = useInteractionStore();
    const [showComments, setShowComments] = useState(false);

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
        const subject = encodeURIComponent(`Achat de prod - "${beat.title}"`);
        const body = encodeURIComponent(`Bonjour,\n\nJe suis intéressé par la prod "${beat.title}"${beat.price !== undefined ? ` (${beat.price.toFixed(2)}€)` : ''}.\n\nPouvez-vous me contacter pour finaliser l'achat ?\n\nMerci !`);
        window.location.href = `mailto:contact@favelas.eu?subject=${subject}&body=${body}`;
    };

    return (
        <div>
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
                {/* Cover / Vinyl */}
                <div className="relative shrink-0">
                    {beat.cover_path ? (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                            <Image
                                src={beat.cover_path}
                                alt={beat.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <VinylDisc spinning={isCurrentPlaying} />
                    )}
                    {/* Play button overlay */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePlay(); }}
                        className={cn(
                            "absolute inset-0 rounded-lg flex items-center justify-center bg-black/60 transition-all",
                            "opacity-0 group-hover:opacity-100",
                            isCurrentPlaying ? "opacity-100" : ""
                        )}
                    >
                        {isCurrentPlaying
                            ? <Pause className="w-3.5 h-3.5 text-white fill-white" />
                            : <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        }
                    </button>
                </div>

                {/* Index (hidden when cover shown) */}
                {!beat.cover_path && (
                    <span className={cn(
                        "hidden absolute left-3 text-sm text-zinc-500 font-mono pointer-events-none",
                        "group-hover:opacity-0",
                        isCurrentPlaying ? "opacity-0" : "opacity-100"
                    )}>
                        {index + 1}
                    </span>
                )}

                {/* Title, Description & Mobile Badges */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={cn(
                            "font-medium truncate transition-colors",
                            isCurrent ? "text-white" : "text-zinc-300 group-hover:text-white"
                        )}>
                            {beat.title}
                        </h4>
                        {beat.for_sale && beat.price !== undefined && (
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
                    {beat.for_sale && beat.price !== undefined && (
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
                            <span>{Math.max(0, (beat.like_count || 0) + optLike)}</span>
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
                            <span>{Math.max(0, (beat.dislike_count || 0) + optDislike)}</span>
                        </button>

                        {/* Comment toggle */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowComments((v) => !v); }}
                            className={cn(
                                "flex items-center gap-1 p-1.5 px-2 rounded-full transition-colors",
                                showComments
                                    ? 'text-blue-400 bg-blue-400/10 opacity-100'
                                    : 'text-zinc-500 hover:text-blue-400 hover:bg-white/5'
                            )}
                            style={{ opacity: showComments ? 1 : undefined }}
                            title="Commentaires"
                        >
                            <MessageSquare className={`w-3.5 h-3.5 ${showComments ? 'fill-current' : ''}`} />
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

            {/* Comment section (below the row) */}
            <AnimatePresence>
                {showComments && <CommentSection beatId={beat.id} />}
            </AnimatePresence>
        </div>
    );
}
