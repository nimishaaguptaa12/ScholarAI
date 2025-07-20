// src/ai/flows/spaced-repetition-scheduling.ts
'use server';

/**
 * @fileOverview Implements spaced repetition scheduling to optimize flashcard review times.
 *
 * - scheduleFlashcardReview - A function that schedules flashcard reviews based on the user's performance.
 * - ScheduleFlashcardReviewInput - The input type for the scheduleFlashcardReview function.
 * - ScheduleFlashcardReviewOutput - The return type for the scheduleFlashcardReview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScheduleFlashcardReviewInputSchema = z.object({
  flashcardId: z.string().describe('The ID of the flashcard.'),
  reviewHistory: z
    .array(z.object({date: z.string(), correct: z.boolean()}))
    .describe('The review history of the flashcard.'),
  difficulty: z
    .number()
    .min(0)
    .max(1)
    .describe('The difficulty of the flashcard (0-1).'),
});
export type ScheduleFlashcardReviewInput = z.infer<typeof ScheduleFlashcardReviewInputSchema>;

const ScheduleFlashcardReviewOutputSchema = z.object({
  nextReviewDate: z.string().describe('The date of the next review.'),
});
export type ScheduleFlashcardReviewOutput = z.infer<typeof ScheduleFlashcardReviewOutputSchema>;

export async function scheduleFlashcardReview(
  input: ScheduleFlashcardReviewInput
): Promise<ScheduleFlashcardReviewOutput> {
  return scheduleFlashcardReviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scheduleFlashcardReviewPrompt',
  input: {schema: ScheduleFlashcardReviewInputSchema},
  output: {schema: ScheduleFlashcardReviewOutputSchema},
  prompt: `You are an AI assistant that schedules flashcard reviews using spaced repetition.

    Given the flashcard's review history, difficulty, and the current date, determine the next review date.

    Review History:
    {{#each reviewHistory}}
    - Date: {{date}}, Correct: {{correct}}
    {{/each}}

    Difficulty: {{difficulty}}
    Current Date: {{moment format="YYYY-MM-DD"}}

    Consider these principles of spaced repetition:
    - If the user answered correctly, increase the interval until the next review.
    - If the user answered incorrectly, decrease the interval until the next review.
    - Harder flashcards should be reviewed more frequently.

    Return the next review date in YYYY-MM-DD format.
    `,
});

const scheduleFlashcardReviewFlow = ai.defineFlow(
  {
    name: 'scheduleFlashcardReviewFlow',
    inputSchema: ScheduleFlashcardReviewInputSchema,
    outputSchema: ScheduleFlashcardReviewOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
