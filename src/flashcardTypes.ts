export interface Flashcard {
  id: string;
  pageId?: string;
  front: string;
  back: string;
  tags?: string[];
  box: number; // 0 (new), 1, 2, 3, 4, 5 (mastered)
  dueDate: number; // timestamp
  reviewsCount: number;
  createdAt: number;
  lastReviewed?: number;
}

export interface FlashcardSettings {
  newCardsPerDay: number;
  pacing: 'relaxed' | 'standard' | 'intensive'; // relaxed: 10, standard: 20, intensive: 40
  order: 'shuffle' | 'sequential';
  flipSpeed: number; // ms
  soundEnabled: boolean;
  timerSeconds: number; // 0 for off, or 15/30/60
}

export const DEFAULT_FLASHCARD_SETTINGS: FlashcardSettings = {
  newCardsPerDay: 20,
  pacing: 'standard',
  order: 'sequential',
  flipSpeed: 300,
  soundEnabled: true,
  timerSeconds: 0,
};
