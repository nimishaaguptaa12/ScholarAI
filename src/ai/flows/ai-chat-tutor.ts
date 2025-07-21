
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
  flashcardContext: z.object({
    question: z.string(),
    answer: z.string(),
  }).optional().describe('The context of the flashcard the user is currently studying.'),
});
export type AIChatTutorInput = z.infer<typeof AIChatTutorInputSchema>;

const PromptInputSchema = z.object({
  message: z.string(),
  formattedHistory: z.string(),
  flashcardContext: z.object({
    question: z.string(),
    answer: z.string(),
  }).optional(),
});

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
  input: {schema: PromptInputSchema},
  output: {schema: AIChatTutorOutputSchema},
  prompt: `You are an AI chat tutor that helps students create flashcards and test their knowledge.

  Your goal is to help the student understand the material and create effective flashcards for studying.
  You should engage the student in a conversation, ask questions, and provide feedback.
  If the student asks you to generate flashcards, you should generate a list of flashcards based on the conversation, or uploaded material.

  {{#if flashcardContext}}
  The user is currently studying the following flashcard. Use this as the primary context for the conversation.
  - Question: {{flashcardContext.question}}
  - Answer: {{flashcardContext.answer}}
  {{/if}}

  Here are some example flashcards you can create if asked:
  - Question: What is the capital of France?
  - Answer: Paris
  - Question: What is the powerhouse of the cell?
  - Answer: Mitochondria

  Here is the chat history:
  {{{formattedHistory}}}

  User: {{message}}
  Assistant: `,
});

const aiChatTutorFlow = ai.defineFlow(
  {
    name: 'aiChatTutorFlow',
    inputSchema: AIChatTutorInputSchema,
    outputSchema: AIChatTutorOutputSchema,
  },
  async ({ message, chatHistory, flashcardContext }) => {
    // Format the history into a simple string before sending to the prompt
    const formattedHistory = (chatHistory || [])
      .map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`)
      .join('\n');

    const {output} = await prompt({
        message,
        formattedHistory,
        flashcardContext,
    });
    return output!;
  }
);
