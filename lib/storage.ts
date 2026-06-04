import { Paper } from './types';

const CURRENT_PAPER_KEY = 'paperpilot_current_paper';

export function savePaperToStorage(paper: Paper): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CURRENT_PAPER_KEY, JSON.stringify(paper));
  } catch (error) {
    console.error('Error saving paper to storage:', error);
  }
}

export function getPaperFromStorage(): Paper | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CURRENT_PAPER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading paper from storage:', error);
    return null;
  }
}

export function clearPaperFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CURRENT_PAPER_KEY);
  } catch (error) {
    console.error('Error clearing paper from storage:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
