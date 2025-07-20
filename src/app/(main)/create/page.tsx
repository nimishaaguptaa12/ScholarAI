"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, BookPlus } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { generateFlashcards } from "@/lib/actions";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  documentText: z.string().min(50, {
    message: "Please enter at least 50 characters of text.",
  }),
  deckId: z.string({
    required_error: "Please select a deck to add the flashcards to.",
  }),
});

export default function CreatePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Omit<Flashcard, 'id' | 'deckId'>[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
    const userDecks = allDecks.filter(d => d.userId === currentUser.id);
    setDecks(userDecks);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { documentText: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setGeneratedCards([]);
    try {
      const result = await generateFlashcards({ documentText: values.documentText });
      if (result && result.length > 0) {
        setGeneratedCards(result.map(card => ({
            ...card,
            lastReviewed: null,
            nextReviewDate: null,
            difficulty: 0.5,
            reviewHistory: [],
        })));
        toast({
          title: "Flashcards Generated!",
          description: `Successfully created ${result.length} flashcards.`,
        });

        // Save to local storage
        const allFlashcards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
        const newFlashcards: Flashcard[] = result.map(card => ({
            ...card,
            id: Date.now().toString() + Math.random(),
            deckId: values.deckId,
            lastReviewed: null,
            nextReviewDate: null,
            difficulty: 0.5,
            reviewHistory: [],
        }));
        localStorage.setItem("flashcards", JSON.stringify([...allFlashcards, ...newFlashcards]));
        
        router.push(`/decks/${values.deckId}`);

      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: "Could not generate flashcards from the provided text. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An Error Occurred",
        description: "Something went wrong during generation. Please try again.",
      });
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Flashcards with AI</h1>
          <p className="text-muted-foreground">
            Paste any text below, and we'll automatically create flashcards for you.
          </p>
        </div>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Content Input</CardTitle>
              <CardDescription>
                Provide the text content you want to turn into flashcards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="documentText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text from your document, article, or notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your content here..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deckId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add to Deck</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={decks.length === 0}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder={decks.length > 0 ? "Select a deck" : "Please create a deck first"} />
                         </SelectTrigger>
                       </FormControl>
                      <SelectContent>
                        {decks.map((deck) => (
                          <SelectItem key={deck.id} value={deck.id}>
                            {deck.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating || decks.length === 0}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookPlus className="mr-2 h-4 w-4" />
                    Generate & Add to Deck
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
