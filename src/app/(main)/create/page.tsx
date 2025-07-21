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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, BookPlus } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { generateFlashcards } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  documentText: z.string().min(50, {
    message: "Please enter at least 50 characters of text.",
  }),
  creationMode: z.enum(["existing", "new"]),
  deckId: z.string().optional(),
  newDeckName: z.string().optional(),
  newDeckDescription: z.string().optional(),
})
.superRefine((data, ctx) => {
    if (data.creationMode === 'existing' && !data.deckId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['deckId'],
            message: 'Please select a deck.',
        });
    }
    if (data.creationMode === 'new' && (!data.newDeckName || data.newDeckName.length < 3)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['newDeckName'],
            message: 'New deck name must be at least 3 characters.',
        });
    }
});

export default function CreatePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      documentText: "",
      creationMode: "existing",
    },
  });
  
  const creationMode = form.watch("creationMode");

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
    const userDecks = allDecks.filter(d => d.userId === currentUser.id);
    setDecks(userDecks);
    // Default to 'new' if no decks exist
    if (userDecks.length === 0) {
        form.setValue("creationMode", "new");
    }
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
      let targetDeckId = values.deckId;

      // Create a new deck if needed
      if (values.creationMode === 'new') {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const newDeck: Deck = {
            id: Date.now().toString(),
            name: values.newDeckName!,
            description: values.newDeckDescription || '',
            userId: currentUser.id,
        };
        const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
        localStorage.setItem("decks", JSON.stringify([...allDecks, newDeck]));
        targetDeckId = newDeck.id;
      }
      
      if (!targetDeckId) {
          toast({ variant: "destructive", title: "No Deck Selected", description: "Please select or create a deck."});
          setIsGenerating(false);
          return;
      }

      // Generate flashcards
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
          description: `Successfully created ${result.length} flashcards in the deck.`,
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
  
  const isSubmitDisabled = isGenerating || (creationMode === 'existing' && decks.length === 0);

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
            <CardContent className="space-y-6">
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
                name="creationMode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Destination Deck</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="existing" disabled={decks.length === 0} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Add to existing deck
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="new" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Create a new deck
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={cn("space-y-4 rounded-md border p-4 transition-opacity", creationMode === 'existing' ? 'opacity-100' : 'opacity-50 pointer-events-none')}>
                 <FormField
                    control={form.control}
                    name="deckId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Existing Decks</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value} disabled={creationMode !== 'existing' || decks.length === 0}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder={decks.length > 0 ? "Select a deck" : "No existing decks found"} />
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
              </div>
              
              <div className={cn("space-y-4 rounded-md border p-4 transition-opacity", creationMode === 'new' ? 'opacity-100' : 'opacity-50 pointer-events-none')}>
                  <FormField
                    control={form.control}
                    name="newDeckName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Deck Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Quantum Physics 101" {...field} disabled={creationMode !== 'new'} />
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
                        <FormLabel>New Deck Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="A brief description of what this deck is about." {...field} disabled={creationMode !== 'new'}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitDisabled}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BookPlus className="mr-2 h-4 w-4" />
                    Generate & Save
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
