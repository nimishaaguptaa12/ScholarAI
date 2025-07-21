"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Send, User, BookPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiChatTutor } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@/lib/types";

type Message = {
  role: "user" | "assistant";
  content: string;
  flashcards?: { question: string; answer: string }[];
};

interface TutorChatProps extends React.HTMLAttributes<HTMLDivElement> {
    initialFlashcard?: Flashcard;
}

export function TutorChat({ className, initialFlashcard }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Set initial message once
  useEffect(() => {
    let firstMessage = "Hello! I'm your AI Tutor. What subject would you like to study today? You can ask me to explain concepts, test your knowledge, or create flashcards for you.";
    if (initialFlashcard) {
        firstMessage = `I see you're reviewing the flashcard: "${initialFlashcard.question}". What can I help you with? You can ask me to explain the answer, provide examples, or test your knowledge on this topic.`
    }
    setMessages([{ role: "assistant", content: firstMessage }]);
  }, [initialFlashcard]);

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    
    // Pass the initial flashcard context if it exists
    const flashcardContext = initialFlashcard ? {
        question: initialFlashcard.question,
        answer: initialFlashcard.answer
    } : undefined;

    const chatHistory = newMessages.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content
    }));

    try {
      const response = await aiChatTutor({ message: input, chatHistory, flashcardContext });
      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        flashcards: response.flashcards,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFlashcards = (cards: { question: string; answer: string }[]) => {
    // This is a placeholder. A full implementation would let user select a deck.
    toast({
        title: "Feature not implemented",
        description: "Saving flashcards from chat will be available soon!",
    })
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-grow p-6 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex items-start gap-4", {
                "justify-end": message.role === "user",
              })}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn("max-w-lg rounded-xl px-4 py-3", {
                  "bg-primary/20 text-foreground": message.role === "assistant",
                  "bg-primary text-primary-foreground": message.role === "user",
                })}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.flashcards && message.flashcards.length > 0 && (
                    <Card className="my-4 bg-background/70">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" /> Generated Flashcards
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {message.flashcards.map((card, i) => (
                                <div key={i} className="border-t pt-2">
                                    <p><strong>Q:</strong> {card.question}</p>
                                    <p><strong>A:</strong> {card.answer}</p>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button size="sm" variant="secondary" onClick={() => handleSaveFlashcards(message.flashcards!)}>
                                <BookPlus className="mr-2 h-4 w-4" /> Save to Deck
                            </Button>
                        </CardFooter>
                    </Card>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4">
               <Avatar className="h-8 w-8 border-2 border-primary">
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              <div className="max-w-lg rounded-xl px-4 py-3 bg-primary/20 flex items-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t p-4 bg-background rounded-b-xl">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
            placeholder="Ask me anything..."
            className="pr-12 h-12"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            onClick={handleSend}
            disabled={isLoading || input.trim() === ""}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
