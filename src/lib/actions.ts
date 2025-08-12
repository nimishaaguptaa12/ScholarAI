"use server";

import { generateFlashcards as genFlashcards, type GenerateFlashcardsInput, type GenerateFlashcardsOutput, scheduleFlashcardReview as scheduleReview, type ScheduleFlashcardReviewInput, type ScheduleFlashcardReviewOutput, aiChatTutor as chatTutor, type AIChatTutorInput, type AIChatTutorOutput } from "@/ai/flows";

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  try {
    const result = await genFlashcards(input);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error generating flashcards:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function scheduleFlashcardReview(input: ScheduleFlashcardReviewInput): Promise<ScheduleFlashcardReviewOutput> {
  try {
    return await scheduleReview(input);
  } catch (error) {
    console.error("Error scheduling review:", error instanceof Error ? error.message : String(error));
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { nextReviewDate: tomorrow.toISOString().split("T")[0] };
  }
}

export async function aiChatTutor(input: AIChatTutorInput): Promise<AIChatTutorOutput> {
  try {
    return await chatTutor(input);
  } catch (error) {
    console.error("Error with AI Tutor:", error instanceof Error ? error.message : String(error));
    return { response: "I'm sorry, I encountered an error. Please try again." };
  }
}
