import { config } from 'dotenv';
config();

import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/spaced-repetition-scheduling.ts';
import '@/ai/flows/ai-chat-tutor.ts';