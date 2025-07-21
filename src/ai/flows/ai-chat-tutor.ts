// src/ai/flows/ai-chat-tutor.ts
'use server';

/**
 * @fileOverview An AI chat tutor flow to help users create flashcards and test their knowledge.
 *
 * - aiChatTutor - A function that handles the chat interaction and flashcard generation.
 * - AIChatTutorInput - The input type for the aiChatTutor function.
 * - AIChatTutorOutput - The return type for the aiChatTutor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatTutorInputSchema = z.object({
  message: z.string().describe('The user message to the AI chat tutor.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the AI.'),
});
export type AIChatTutorInput = z.infer<typeof AIChatTutorInputSchema>;

const AIChatTutorOutputSchema = z.object({
  response: z.string().describe('The AI chat tutor response.'),
  flashcards: z.array(z.object({
    question: z.string().describe('The flashcard question.'),
    answer: z.string().describe('The flashcard answer.'),
  })).optional().describe('The generated flashcards from the conversation.'),
});
export type AIChatTutorOutput = z.infer<typeof AIChatTutorOutputSchema>;

export async function aiChatTutor(input: AIChatTutorInput): Promise<AIChatTutorOutput> {
  return aiChatTutorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatTutorPrompt',
  input: {schema: AIChatTutorInputSchema},
  output: {schema: AIChatTutorOutputSchema},
  prompt: `You are an AI chat tutor that helps students create flashcards and test their knowledge.

  Your goal is to help the student understand the material and create effective flashcards for studying.
  You should engage the student in a conversation, ask questions, and provide feedback.
  If the student asks you to generate flashcards, you should generate a list of flashcards based on the conversation, or uploaded material.

  Here are some example flashcards:
  - Question: What is the capital of France?
  - Answer: Paris
  - Question: What is the powerhouse of the cell?
  - Answer: Mitochondria

  Here is the chat history:
  {{#if chatHistory}}
  {{#each chatHistory}}
  {{#if (eq role "user")}}
  User: {{content}}
  {{else}}
  Assistant: {{content}}
  {{/if}}
  {{/each}}
  {{/if}}

  User: {{message}}
  Assistant: `,
});

const aiChatTutorFlow = ai.defineFlow(
  {
    name: 'aiChatTutorFlow',
    inputSchema: AIChatTutorInputSchema,
    outputSchema: AIChatTutorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
