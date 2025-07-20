export interface User {
  id: string;
  username: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  lastReviewed: string | null;
  nextReviewDate: string | null;
  difficulty: number; // 0-1 scale
  reviewHistory: { date: string; correct: boolean }[];
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  userId: string;
}

export interface QuizScore {
  deckId: string;
  date: string;
  score: number; // Percentage
}
