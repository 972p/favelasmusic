import { create } from 'zustand';
import { Beat } from '@/lib/storage';

// Persistent shared Audio element for seamless multi-platform playback
// Critical for mobile/iOS policies: allows synchronous .play() invocation inside click handlers
export const globalAudio = typeof window !== 'undefined' ? new Audio() : null;

if (globalAudio) {
  globalAudio.crossOrigin = "anonymous";
  // Keep store state automatically synchronized with the native audio element state
  globalAudio.addEventListener('play', () => {
    useAudioStore.setState({ isPlaying: true });
  });
  globalAudio.addEventListener('pause', () => {
    useAudioStore.setState({ isPlaying: false });
  });
  globalAudio.addEventListener('ended', () => {
    useAudioStore.setState({ isPlaying: false });
  });
}

interface AudioState {
  currentBeat: Beat | null;
  isPlaying: boolean;
  volume: number;
  
  // Actions
  setBeat: (beat: Beat | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentBeat: null,
  isPlaying: false,
  volume: 1,

  setBeat: (beat) => {
    const current = get().currentBeat;
    if (globalAudio && beat) {
      // If switching tracks, set src directly to start buffering immediately during the gesture
      if (current?.id !== beat.id) {
        globalAudio.src = beat.audio_path;
        globalAudio.load();
      }
    } else if (globalAudio && !beat) {
      globalAudio.pause();
      globalAudio.src = "";
    }
    set({ currentBeat: beat });
  },

  play: () => {
    if (globalAudio) {
      globalAudio.play().catch(err => console.error("Audio play error:", err));
    }
    set({ isPlaying: true });
  },

  pause: () => {
    if (globalAudio) {
      globalAudio.pause();
    }
    set({ isPlaying: false });
  },

  togglePlay: () => {
    if (get().isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  setVolume: (volume) => {
    if (globalAudio) {
      globalAudio.volume = volume;
    }
    set({ volume });
  },
}));
