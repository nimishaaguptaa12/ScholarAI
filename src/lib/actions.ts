"use server";

import { generateFlashcards as genFlashcards, type GenerateFlashcardsInput, type GenerateFlashcardsOutput } from "@/ai/flows/generate-flashcards";
import { scheduleFlashcardReview as scheduleReview, type ScheduleFlashcardReviewInput, type ScheduleFlashcardReviewOutput } from "@/ai/flows/spaced-repetition-scheduling";
import { aiChatTutor as chatTutor, type AIChatTutorInput, type AIChatTutorOutput } from "@/ai/flows/ai-chat-tutor";

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  // In a real app, you might add user authentication checks here
  try {
    return await genFlashcards(input);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    // Return an empty array or throw a more specific error
    return [];
  }
}

export async function scheduleFlashcardReview(input: ScheduleFlashcardReviewInput): Promise<ScheduleFlashcardReviewOutput> {
  try {
    return await scheduleReview(input);
  } catch (error) {
    console.error("Error scheduling review:", error);
    // Return a default next-day review or throw
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { nextReviewDate: tomorrow.toISOString().split("T")[0] };
  }
}

export async function aiChatTutor(input: AIChatTutorInput): Promise<AIChatTutorOutput> {
  try {
    return await chatTutor(input);
  } catch (error) {
    console.error("Error with AI Tutor:", error);
    return { response: "I'm sorry, I encountered an error. Please try again." };
  }
}
