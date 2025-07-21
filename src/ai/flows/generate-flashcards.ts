
'use server';

/**
 * @fileOverview Flow to automatically generate flashcards from a document.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  documentText: z.string().optional().describe('The text content of the document to generate flashcards from.'),
  documentFile: z.string().optional().describe("A PDF file of the document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."),
}).refine(data => data.documentText || data.documentFile, {
    message: "Either documentText or documentFile must be provided.",
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const FlashcardSchema = z.object({
  question: z.string().describe('The question for the flashcard.'),
  answer: z.string().describe('The answer to the question.'),
});

const GenerateFlashcardsOutputSchema = z.array(FlashcardSchema);
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are a helpful AI assistant that generates flashcards from a given document.

  Your task is to analyze the provided document and create a list of question-and-answer pairs suitable for flashcards.
  Identify the key concepts, definitions, important facts, and main ideas.

  {{#if documentText}}
  The document content is provided as plain text below. Analyze it to generate flashcards.
  Document Text: {{{documentText}}}
  {{/if}}
  
  {{#if documentFile}}
  The document is provided as a file. It may contain text, images, or a combination of both.
  Analyze all content within the file, including text and visual elements, to generate comprehensive flashcards.
  If there are images, create questions based on what is depicted.
  Document File: {{media url=documentFile}}
  {{/if}}

  Return the flashcards as a JSON array of objects, where each object has a "question" and "answer" field.
  `,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output || [];
  }
);
