"use client";

import { useEffect, useRef, useState } from "react";
import { useAudioStore } from "@/store/useAudioStore";
import { useToastStore } from "@/store/useToastStore";
import { Play, Pause, Volume2, VolumeX, X, Music, ChevronUp, ChevronDown } from "lucide-react"; 
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
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "rgba(255, 255, 255, 0.2)",
      progressColor: "#ededed",
      cursorColor: "transparent",
      barWidth: 2,
      barGap: 3,
      height: 40,
      normalize: true,
      backend: "WebAudio",
    });

    wavesurfer.current.on("audioprocess", () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
    });

    wavesurfer.current.on("ready", () => {
      setDuration(wavesurfer.current?.getDuration() || 0);
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
    
    // Don't try to play if not ready (avoids race conditions with load)
    // The 'ready' event handles the initial autoplay.
    const isReady = wavesurfer.current.getDuration() > 0;
    if (!isReady && isPlaying) return;

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
    
    // Reset state immediately on track change
    setCurrentTime(0);
    wavesurfer.current.seekTo(0);
    
    const audioUrl = `${encodeURI(currentBeat.audioPath)}?t=${Date.now()}`;
    
    // WaveSurfer.load returns a promise. We must catch abort errors.
    const loadPromise = wavesurfer.current.load(audioUrl);
    
    if (loadPromise && typeof loadPromise.then === 'function') {
        loadPromise.catch((err) => {
            // Ignore abort errors (happens on track switch or unmount)
            if (err.name === 'AbortError' || err.message?.includes('aborted') || err.name === 'DOMException') return;
            console.error("Load error", err);
            addToast("Failed to load audio URL", "error");
        });
    }
  }, [currentBeat]);
  
  if (!currentBeat) return null;

  const hasBpmOrKey = (currentBeat.bpm && currentBeat.bpm > 0) || (currentBeat.key && currentBeat.key.trim() !== "");

  return (
        <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none"
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
                            {/* Subtle animated gradient background */}
                            <div 
                                className="absolute inset-0 opacity-[0.07] rounded-2xl"
                                style={{
                                    background: "linear-gradient(135deg, #fff 0%, transparent 40%, transparent 60%, #fff 100%)",
                                    backgroundSize: "200% 200%",
                                    animation: "liquid 8s ease-in-out infinite",
                                }}
                            />

                            <div className="relative flex items-center justify-center gap-8">
                                {/* Cover Art Large */}
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                                    {currentBeat.coverPath ? (
                                        <img src={currentBeat.coverPath} alt={currentBeat.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Music className="w-8 h-8 text-white/20" />
                                        </div>
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex flex-col items-start gap-1">
                                    <h2 className="text-lg font-semibold text-white tracking-wide">{currentBeat.title}</h2>
                                    
                                    {/* BPM & Key Display - Large */}
                                    <div className="flex items-center gap-4 mt-1">
                                        {currentBeat.bpm > 0 && (
                                            <div className="flex items-baseline gap-2">
                                                <span 
                                                    className="text-4xl font-bold text-white tracking-tight tabular-nums"
                                                    style={{ fontVariantNumeric: "tabular-nums" }}
                                                >
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
            <div className="max-w-4xl mx-auto bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden pointer-events-auto">
                <div className="flex items-center gap-4">
                    {/* Cover Art (Small) */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        {currentBeat.coverPath ? (
                             <img src={currentBeat.coverPath} alt={currentBeat.title} className="w-full h-full object-cover" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-xs text-white/30">IMG</div>
                        )}
                    </div>

                    {/* Controls & Waveform */}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3 truncate">
                                <div className="flex flex-col truncate">
                                    <h3 className="text-sm font-medium text-white truncate">{currentBeat.title}</h3>
                                    <span className="text-xs text-zinc-400">
                                        {formatTime(currentTime)} / {formatTime(duration)}
                                    </span>
                                </div>
                                
                                {/* Inline BPM/Key Badges */}
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
                                    </div>
                                )}
                             </div>
                             
                             <div className="flex items-center gap-2">
                                 {/* Expand info button */}
                                 {hasBpmOrKey && (
                                     <button 
                                         onClick={() => setShowInfoPanel(!showInfoPanel)} 
                                         className={cn(
                                             "text-zinc-500 hover:text-white transition-colors",
                                             showInfoPanel && "text-white"
                                         )}
                                         title={showInfoPanel ? "Masquer les infos" : "Voir BPM & Clé"}
                                     >
                                         {showInfoPanel ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                     </button>
                                 )}
                                 <button onClick={togglePlay} className="text-white hover:text-zinc-300 transition-colors">
                                     {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                                 </button>
                                 <button 
                                     onClick={() => {
                                         pause();
                                         setBeat(null);
                                     }} 
                                     className="text-zinc-400 hover:text-red-400 transition-colors" 
                                     title="Close Player"
                                 >
                                     <X className="w-4 h-4" />
                                 </button>
                             </div>
                        </div>
                        
                        {/* Waveform Container */}
                        <div ref={containerRef} className="w-full opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>

                     {/* Volume & More */}
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
        </motion.div>
  );
}
