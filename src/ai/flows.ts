import { genkit } from 'genkit'
import { googleAI } from '@genkit-ai/googleai'
import { z } from 'genkit'

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
})

// ---------------------- Generate Flashcards ----------------------
const GenerateFlashcardsInputSchema = z
  .object({
    documentText: z
      .string()
      .optional()
      .describe('The text content of the document to generate flashcards from.'),
    documentFile: z
      .string()
      .optional()
      .describe(
        "A PDF file of the document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'.",
      ),
  })
  .refine((data) => data.documentText || data.documentFile, {
    message: 'Either documentText or documentFile must be provided.',
  })
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>

const FlashcardSchema = z.object({
  question: z.string().describe('The question for the flashcard.'),
  answer: z.string().describe('The answer to the question.'),
})

const GenerateFlashcardsOutputSchema = z.array(FlashcardSchema)
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>

const generateFlashcardsPrompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: { schema: GenerateFlashcardsInputSchema },
  output: { schema: GenerateFlashcardsOutputSchema },
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
})

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async (input) => {
    const { output } = await generateFlashcardsPrompt(input)
    return output || []
  },
)

export async function generateFlashcards(
  input: GenerateFlashcardsInput,
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input)
}

// ---------------------- AI Chat Tutor ----------------------
const AIChatTutorInputSchema = z.object({
  message: z.string().describe('The user message to the AI chat tutor.'),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .describe('The chat history between the user and the AI.'),
  flashcardContext: z
    .object({
      question: z.string(),
      answer: z.string(),
    })
    .optional()
    .describe('The context of the flashcard the user is currently studying.'),
})
export type AIChatTutorInput = z.infer<typeof AIChatTutorInputSchema>

const PromptInputSchema = z.object({
  message: z.string(),
  formattedHistory: z.string(),
  flashcardContext: z
    .object({
      question: z.string(),
      answer: z.string(),
    })
    .optional(),
})

const AIChatTutorOutputSchema = z.object({
  response: z.string().describe('The AI chat tutor response.'),
  flashcards: z
    .array(
      z.object({
        question: z.string().describe('The flashcard question.'),
        answer: z.string().describe('The flashcard answer.'),
      }),
    )
    .optional()
    .describe('The generated flashcards from the conversation.'),
})
export type AIChatTutorOutput = z.infer<typeof AIChatTutorOutputSchema>

const aiChatTutorPrompt = ai.definePrompt({
  name: 'aiChatTutorPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: AIChatTutorOutputSchema },
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
})

const aiChatTutorFlow = ai.defineFlow(
  {
    name: 'aiChatTutorFlow',
    inputSchema: AIChatTutorInputSchema,
    outputSchema: AIChatTutorOutputSchema,
  },
  async ({ message, chatHistory, flashcardContext }) => {
    const formattedHistory = (chatHistory || [])
      .map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`)
      .join('\n')

    const { output } = await aiChatTutorPrompt({
      message,
      formattedHistory,
      flashcardContext,
    })
    return output!
  },
)

export async function aiChatTutor(input: AIChatTutorInput): Promise<AIChatTutorOutput> {
  return aiChatTutorFlow(input)
}

// ---------------------- Spaced Repetition Scheduling ----------------------
const ScheduleFlashcardReviewInputSchema = z.object({
  flashcardId: z.string().describe('The ID of the flashcard.'),
  reviewHistory: z
    .array(z.object({ date: z.string(), correct: z.boolean() }))
    .describe("The review history of the flashcard."),
  difficulty: z.number().min(0).max(1).describe('The difficulty of the flashcard (0-1).'),
})
export type ScheduleFlashcardReviewInput = z.infer<typeof ScheduleFlashcardReviewInputSchema>

const ScheduleFlashcardReviewOutputSchema = z.object({
  nextReviewDate: z.string().describe('The date of the next review.'),
})
export type ScheduleFlashcardReviewOutput = z.infer<typeof ScheduleFlashcardReviewOutputSchema>

const scheduleFlashcardReviewPrompt = ai.definePrompt({
  name: 'scheduleFlashcardReviewPrompt',
  input: { schema: ScheduleFlashcardReviewInputSchema },
  output: { schema: ScheduleFlashcardReviewOutputSchema },
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
})

const scheduleFlashcardReviewFlow = ai.defineFlow(
  {
    name: 'scheduleFlashcardReviewFlow',
    inputSchema: ScheduleFlashcardReviewInputSchema,
    outputSchema: ScheduleFlashcardReviewOutputSchema,
  },
  async (input) => {
    const { output } = await scheduleFlashcardReviewPrompt(input)
    return output!
  },
)

export async function scheduleFlashcardReview(
  input: ScheduleFlashcardReviewInput,
): Promise<ScheduleFlashcardReviewOutput> {
  return scheduleFlashcardReviewFlow(input)
}