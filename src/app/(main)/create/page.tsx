"use client";

import { useState } from "react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, BookPlus } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { generateFlashcards } from "@/lib/actions";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  newDeckName: z.string().min(3, {
    message: "Deck name must be at least 3 characters.",
  }),
  newDeckDescription: z.string().optional(),
  documentText: z.string().min(50, {
    message: "Please enter at least 50 characters of text to generate flashcards from.",
  }),
});

export default function CreatePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDeckName: "",
      newDeckDescription: "",
      documentText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
      // Create the new deck
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (!currentUser.id) {
          toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to create a deck." });
          setIsGenerating(false);
          return;
      }

      const newDeck: Deck = {
          id: Date.now().toString(),
          name: values.newDeckName,
          description: values.newDeckDescription || '',
          userId: currentUser.id,
      };
      
      const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
      localStorage.setItem("decks", JSON.stringify([...allDecks, newDeck]));
      const targetDeckId = newDeck.id;

      // Generate flashcards for the new deck
      const result = await generateFlashcards({ documentText: values.documentText });
      
      if (result && result.length > 0) {
        // Save flashcards to local storage
        const allFlashcards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
        const newFlashcards: Flashcard[] = result.map(card => ({
            ...card,
            id: Date.now().toString() + Math.random(),
            deckId: targetDeckId!,
            lastReviewed: null,
            nextReviewDate: null,
            difficulty: 0.5,
            reviewHistory: [],
        }));
        localStorage.setItem("flashcards", JSON.stringify([...allFlashcards, ...newFlashcards]));
        
        toast({
          title: "Success!",
          description: `Successfully created the "${newDeck.name}" deck with ${result.length} flashcards.`,
        });
        
        router.push(`/decks/${targetDeckId}`);
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
          <h1 className="text-3xl font-bold tracking-tight">Create New AI Deck</h1>
          <p className="text-muted-foreground">
            Provide a deck name, paste your content, and let AI do the rest.
          </p>
        </div>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Deck Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="newDeckName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deck Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Quantum Physics 101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newDeckDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A brief description of what this deck is about." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <FormField
                control={form.control}
                name="documentText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content to Generate Flashcards From</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your document, article, or notes here..."
                        className="min-h-[250px] resize-y"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                        Enter at least 50 characters.
                     </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookPlus className="mr-2 h-4 w-4" />
                    Create Deck & Generate
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
