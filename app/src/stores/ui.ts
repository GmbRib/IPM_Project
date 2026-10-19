import { create } from 'zustand';

import type { ID } from '@/data/types';

type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void };

type UiState = {
  /** Trip shown on the Viagens tab; null = the current/next trip. */
  selectedTripId: ID | null;
  selectTrip(id: ID | null): void;

  toast: Toast | null;
  /** Short message at the bottom of the screen, optionally with an action ("Anular"). */
  showToast(toast: Omit<Toast, 'id'>): void;
  hideToast(): void;
};

let nextToastId = 1;

export const useUi = create<UiState>()((set) => ({
  selectedTripId: null,
  selectTrip: (id) => set({ selectedTripId: id }),

  toast: null,
  showToast: (toast) => set({ toast: { ...toast, id: nextToastId++ } }),
  hideToast: () => set({ toast: null }),
}));
