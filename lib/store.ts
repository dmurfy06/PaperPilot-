import { create } from 'zustand';
import { Paper, Note } from './types';

interface AppState {
  currentPaper: Paper | null;
  notes: Note[];
  isAnalyzing: boolean;
  error: string | null;

  setCurrentPaper: (paper: Paper | null) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  loadNotesForPaper: (paperId: string) => void;
  loadStoredData: () => void;
  saveToStorage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPaper: null,
  notes: [],
  isAnalyzing: false,
  error: null,

  setCurrentPaper: (paper) => set({ currentPaper: paper }),
  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setError: (error) => set({ error }),

  addNote: (note) => {
    set((state) => {
      const updated = [...state.notes, note];
      return { notes: updated };
    });
    get().saveToStorage();
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      ),
    }));
    get().saveToStorage();
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));
    get().saveToStorage();
  },

  loadNotesForPaper: (paperId) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.paperId === paperId),
    }));
  },

  loadStoredData: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('paperpilot_notes');
      if (stored) {
        const notes = JSON.parse(stored);
        set({ notes });
      }
    } catch (error) {
      console.error('Error loading stored notes:', error);
    }
  },

  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const { notes } = get();
      localStorage.setItem('paperpilot_notes', JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes to storage:', error);
    }
  },
}));
