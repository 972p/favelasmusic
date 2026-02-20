"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioStore } from "@/store/useAudioStore";
import { useToastStore } from "@/store/useToastStore";
import { useInteractionStore } from "@/store/useInteractionStore";
import { Play, Pause, Volume2, VolumeX, X, Music, ChevronUp, ChevronDown, ThumbsUp, ThumbsDown, ShoppingCart } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { formatTime, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalPlayer() {
    const { currentBeat } = useAudioStore();

    return (
        <AnimatePresence>
            {currentBeat && <PlayerContent />}
        </AnimatePresence>
    );
}

function PlayerContent() {
    const { currentBeat, isPlaying, play, pause, togglePlay, volume, setVolume, setBeat } = useAudioStore();
    const { addToast } = useToastStore();
    const { interactions, sessionLikes, sessionDislikes, toggleLike, toggleDislike } = useInteractionStore();
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [isReady, setIsReady] = useState(false);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current) return;

        wavesurfer.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "rgba(91, 44, 111, 0.45)",
            progressColor: "#E67E22",
            cursorColor: "rgba(255,255,255,0.6)",
            cursorWidth: 2,
            barWidth: 3,
            barGap: 2,
            barRadius: 3,
            height: 48,
            normalize: true,
            backend: "WebAudio",
            interact: true,
        });

        wavesurfer.current.on("audioprocess", () => {
            setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
        });

        wavesurfer.current.on("seeking", () => {
            setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
        });

        wavesurfer.current.on("ready", () => {
            const dur = wavesurfer.current?.getDuration() || 0;
            setDuration(dur);
            setIsReady(true);
            if (useAudioStore.getState().isPlaying) {
                wavesurfer.current?.play().catch(err => console.error("Autoplay error:", err));
            }
        });

        wavesurfer.current.on("finish", () => {
            useAudioStore.getState().pause();
        });

        wavesurfer.current.on("error", (err) => {
            console.error("WaveSurfer error:", err);
            addToast("Error playing track", "error");
        });

        return () => {
            try {
                wavesurfer.current?.unAll();
                wavesurfer.current?.destroy();
            } catch (e) {
                console.warn("Cleanup error", e);
            }
        };
    }, []);

    // Handle Play/Pause
    useEffect(() => {
        if (!wavesurfer.current) return;
        const ready = wavesurfer.current.getDuration() > 0;
        if (!ready && isPlaying) return;
        if (isPlaying) {
            wavesurfer.current.play().catch(err => console.error("Play error:", err));
        } else {
            wavesurfer.current.pause();
        }
    }, [isPlaying]);

    // Handle Volume
    useEffect(() => {
        if (!wavesurfer.current) return;
        wavesurfer.current.setVolume(volume);
    }, [volume]);

    // Load Track
    useEffect(() => {
        if (!currentBeat || !wavesurfer.current) return;
        setCurrentTime(0);
        setIsReady(false);
        wavesurfer.current.seekTo(0);
        const audioUrl = `${encodeURI(currentBeat.audioPath)}?t=${Date.now()}`;
        const loadPromise = wavesurfer.current.load(audioUrl);
        if (loadPromise && typeof loadPromise.then === 'function') {
            loadPromise.catch((err) => {
                if (err.name === 'AbortError' || err.message?.includes('aborted') || err.name === 'DOMException') return;
                console.error("Load error", err);
                addToast("Failed to load audio URL", "error");
            });
        }
    }, [currentBeat]);

    if (!currentBeat) return null;

    const progress = duration > 0 ? currentTime / duration : 0;
    const hasBpmOrKey = (currentBeat.bpm && currentBeat.bpm > 0) || (currentBeat.key && currentBeat.key.trim() !== "");
    const interaction = interactions[currentBeat.id];
    const optLike = sessionLikes[currentBeat.id] || 0;
    const optDislike = sessionDislikes[currentBeat.id] || 0;

    const handleCheckout = (e: React.MouseEvent) => {
        e.stopPropagation();
        const text = encodeURIComponent(`Salut ! Je suis intéressé par la prod "${currentBeat.title}"`);
        window.open(`https://twitter.com/messages/compose?text=${text}`, '_blank');
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-3 sm:px-4 pb-3 sm:pb-4 pointer-events-none"
        >
            {/* Expanded Info Panel */}
            <AnimatePresence>
                {showInfoPanel && hasBpmOrKey && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="max-w-4xl mx-auto mb-3 pointer-events-auto"
                    >
                        <div
                            className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 overflow-hidden"
                            style={{ boxShadow: "0 -10px 40px rgba(0,0,0,0.4)" }}
                        >
                            <div
                                className="absolute inset-0 opacity-[0.07] rounded-2xl"
                                style={{
                                    background: "linear-gradient(135deg, #fff 0%, transparent 40%, transparent 60%, #fff 100%)",
                                    backgroundSize: "200% 200%",
                                    animation: "liquid 8s ease-in-out infinite",
                                }}
                            />

                            <div className="relative flex items-center justify-center gap-8">
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                                    {currentBeat.coverPath ? (
                                        <img src={currentBeat.coverPath} alt={currentBeat.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music className="w-8 h-8 text-white/20" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-start gap-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold text-white tracking-wide">{currentBeat.title}</h2>
                                        {currentBeat.forSale && currentBeat.price !== undefined && (
                                            <button
                                                onClick={handleCheckout}
                                                className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold flex items-center gap-1.5 hover:bg-green-500 hover:text-black transition-colors"
                                                title="Acheter"
                                            >
                                                <ShoppingCart className="w-3 h-3" />
                                                €{currentBeat.price.toFixed(2)}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4 mt-1">
                                        {currentBeat.bpm > 0 && (
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-white tracking-tight tabular-nums">
                                                    {currentBeat.bpm}
                                                </span>
                                                <span className="text-sm font-medium text-zinc-400 uppercase tracking-widest">BPM</span>
                                            </div>
                                        )}
                                        {currentBeat.bpm > 0 && currentBeat.key && currentBeat.key.trim() !== "" && (
                                            <div className="w-px h-10 bg-white/10" />
                                        )}
                                        {currentBeat.key && currentBeat.key.trim() !== "" && (
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-white tracking-tight">
                                                    {currentBeat.key.split(" ")[0]}
                                                </span>
                                                <span className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
                                                    {currentBeat.key.split(" ").slice(1).join(" ") || "Key"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Player Bar */}
            <div className="max-w-4xl mx-auto bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                {/* Progress bar strip at top */}
                <div className="relative h-1 w-full bg-white/5">
                    <div
                        className="absolute left-0 top-0 h-full transition-none"
                        style={{
                            width: `${progress * 100}%`,
                            background: "linear-gradient(90deg, #5B2C6F, #E67E22)",
                        }}
                    />
                </div>

                <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Cover Art */}
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            {currentBeat.coverPath ? (
                                <img src={currentBeat.coverPath} alt={currentBeat.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-white/30">
                                    <Music className="w-4 h-4" />
                                </div>
                            )}
                        </div>

                        {/* Controls & Waveform */}
                        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                {/* Title + time */}
                                <div className="flex items-center gap-2 sm:gap-3 truncate min-w-0">
                                    <div className="flex flex-col truncate">
                                        <h3 className="text-xs sm:text-sm font-medium text-white truncate leading-tight">{currentBeat.title}</h3>
                                        <span className="text-[10px] sm:text-xs text-zinc-400 tabular-nums">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>

                                    {/* Inline BPM/Key Badges — desktop only */}
                                    {hasBpmOrKey && (
                                        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                                            {currentBeat.bpm > 0 && (
                                                <span className="px-2 py-0.5 rounded-md bg-white/[0.07] border border-white/10 text-xs font-medium text-zinc-300 tabular-nums">
                                                    {currentBeat.bpm} BPM
                                                </span>
                                            )}
                                            {currentBeat.key && currentBeat.key.trim() !== "" && (
                                                <span className="px-2 py-0.5 rounded-md bg-white/[0.07] border border-white/10 text-xs font-medium text-zinc-300">
                                                    {currentBeat.key}
                                                </span>
                                            )}
                                            {currentBeat.forSale && currentBeat.price !== undefined && (
                                                <button
                                                    onClick={handleCheckout}
                                                    className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold hover:bg-green-500 hover:text-black transition-colors"
                                                    title="Acheter"
                                                >
                                                    €{currentBeat.price.toFixed(2)}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                    {/* Like/Dislike */}
                                    <div className="hidden sm:flex items-center gap-1.5 mr-1 border-r border-white/10 pr-2.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleLike(currentBeat.id); }}
                                            className={cn(
                                                "flex items-center gap-1 p-1.5 px-2 rounded-full transition-colors",
                                                interaction === 'like' ? 'text-green-400 bg-green-400/10' : 'text-zinc-500 hover:text-green-400 hover:bg-white/5'
                                            )}
                                            title="Like"
                                        >
                                            <ThumbsUp className={`w-3.5 h-3.5 ${interaction === 'like' ? 'fill-current' : ''}`} />
                                            <span className="text-xs font-mono">{Math.max(0, (currentBeat.likeCount || 0) + optLike)}</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleDislike(currentBeat.id); }}
                                            className={cn(
                                                "flex items-center gap-1 p-1.5 px-2 rounded-full transition-colors",
                                                interaction === 'dislike' ? 'text-red-400 bg-red-400/10' : 'text-zinc-500 hover:text-red-400 hover:bg-white/5'
                                            )}
                                            title="Dislike"
                                        >
                                            <ThumbsDown className={`w-3.5 h-3.5 ${interaction === 'dislike' ? 'fill-current' : ''}`} />
                                            <span className="text-xs font-mono">{Math.max(0, (currentBeat.dislikeCount || 0) + optDislike)}</span>
                                        </button>
                                    </div>

                                    {hasBpmOrKey && (
                                        <button
                                            onClick={() => setShowInfoPanel(!showInfoPanel)}
                                            className={cn("text-zinc-500 hover:text-white transition-colors hidden sm:block", showInfoPanel && "text-white")}
                                            title={showInfoPanel ? "Masquer les infos" : "Voir BPM & Clé"}
                                        >
                                            {showInfoPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                        </button>
                                    )}

                                    <button onClick={togglePlay} className="text-white hover:text-zinc-300 transition-colors">
                                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                    </button>
                                    <button
                                        onClick={() => { pause(); setBeat(null); }}
                                        className="text-zinc-400 hover:text-red-400 transition-colors"
                                        title="Close Player"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Waveform — full clickable seek */}
                            <div
                                ref={containerRef}
                                className={cn(
                                    "w-full transition-opacity cursor-pointer",
                                    isReady ? "opacity-90 hover:opacity-100" : "opacity-40"
                                )}
                            />
                        </div>

                        {/* Volume — desktop only */}
                        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-white/5">
                            <button
                                onClick={() => setVolume(volume === 0 ? 1 : 0)}
                                className="text-zinc-400 hover:text-white transition-colors"
                            >
                                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-20 accent-white h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
