import { create } from 'zustand';
import { Beat } from '@/lib/storage';

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

export const useAudioStore = create<AudioState>((set) => ({
  currentBeat: null,
  isPlaying: false,
  volume: 1,

  setBeat: (beat) => set({ currentBeat: beat }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ volume }),
}));
