import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type InteractionType = 'like' | 'dislike' | null;

interface InteractionState {
  // Map of beat ID to their interaction type (Persisted)
  interactions: Record<string, InteractionType>;
  // Non-persisted session-level deltas to prevent double counting on refresh
  sessionLikes: Record<string, number>;
  sessionDislikes: Record<string, number>;

  // Actions
  toggleLike: (beatId: string) => void;
  toggleDislike: (beatId: string) => void;
  getInteraction: (beatId: string) => InteractionType;
}

export const useInteractionStore = create<InteractionState>()(
  persist(
    (set, get) => ({
      interactions: {},
      sessionLikes: {},
      sessionDislikes: {},

      toggleLike: async (beatId) => {
        let likeDelta = 0;
        let dislikeDelta = 0;

        set((state) => {
          const current = state.interactions[beatId];
          const newInteractions = { ...state.interactions };

          if (current === 'like') {
            // Remove the like
            delete newInteractions[beatId];
            likeDelta = -1;
          } else if (current === 'dislike') {
            // Set to like (overwriting dislike if present)
            newInteractions[beatId] = 'like';
            likeDelta = 1;
            dislikeDelta = -1;
          } else {
            newInteractions[beatId] = 'like';
            likeDelta = 1;
          }

          const newSessionLikes = {
            ...state.sessionLikes,
            [beatId]: (state.sessionLikes[beatId] || 0) + likeDelta
          };
          const newSessionDislikes = {
            ...state.sessionDislikes,
            [beatId]: (state.sessionDislikes[beatId] || 0) + dislikeDelta
          };

          return {
            interactions: newInteractions,
            sessionLikes: newSessionLikes,
            sessionDislikes: newSessionDislikes
          };
        });

        if (likeDelta !== 0 || dislikeDelta !== 0) {
          try {
            await fetch(`/api/beats/${beatId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ likeDelta, dislikeDelta })
            });
          } catch (err) {
            console.error("Failed to sync interaction to backend", err);
          }
        }
      },

      toggleDislike: async (beatId) => {
        let likeDelta = 0;
        let dislikeDelta = 0;

        set((state) => {
          const current = state.interactions[beatId];
          const newInteractions = { ...state.interactions };

          if (current === 'dislike') {
            // Remove the dislike
            delete newInteractions[beatId];
            dislikeDelta = -1;
          } else if (current === 'like') {
            // Set to dislike (overwriting like if present)
            newInteractions[beatId] = 'dislike';
            dislikeDelta = 1;
            likeDelta = -1;
          } else {
            newInteractions[beatId] = 'dislike';
            dislikeDelta = 1;
          }

          const newSessionLikes = {
            ...state.sessionLikes,
            [beatId]: (state.sessionLikes[beatId] || 0) + likeDelta
          };
          const newSessionDislikes = {
            ...state.sessionDislikes,
            [beatId]: (state.sessionDislikes[beatId] || 0) + dislikeDelta
          };

          return {
            interactions: newInteractions,
            sessionLikes: newSessionLikes,
            sessionDislikes: newSessionDislikes
          };
        });

        if (likeDelta !== 0 || dislikeDelta !== 0) {
          try {
            await fetch(`/api/beats/${beatId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ likeDelta, dislikeDelta })
            });
          } catch (err) {
            console.error("Failed to sync interaction to backend", err);
          }
        }
      },

      getInteraction: (beatId) => {
        return get().interactions[beatId] || null;
      }
    }),
    {
      name: 'beat-interactions-storage',
      storage: createJSONStorage(() => localStorage),
      // ONLY persist interactions to localStorage, so session values reset on reload!
      partialize: (state) => ({ interactions: state.interactions }),
    }
  )
);
