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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, BookPlus, FileText, Upload } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { generateFlashcards } from "@/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  newDeckName: z.string().optional(),
  newDeckDescription: z.string().optional(),
  inputType: z.enum(['text', 'pdf']),
  documentText: z.string().optional(),
  documentFile: z.any().optional(),
}).superRefine((data, ctx) => {
    // If we're creating a new deck (no deckId in URL), name is required.
    if (!data.newDeckName) {
         // This validation should only apply if we are NOT in "add to existing" mode.
         // We can't check URL params here directly, so we infer from newDeckName's presence.
         // A better way is to handle this logic outside the schema or pass context.
         // For now, we'll make it optional and check in onSubmit.
    }

    if (data.inputType === 'text' && (!data.documentText || data.documentText.length < 50)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please paste text (min 50 chars).",
            path: ["documentText"],
        });
    }
    if (data.inputType === 'pdf' && !data.documentFile) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please upload a PDF file.",
            path: ["documentFile"],
        });
    }
});

export default function CreatePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deckId');

  const [deck, setDeck] = useState<Deck | null>(null);
  
  const isAddingToExistingDeck = !!deckId;

  useEffect(() => {
    if (deckId) {
        const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
        const currentDeck = allDecks.find(d => d.id === deckId);
        if (currentDeck) {
            setDeck(currentDeck);
        } else {
            toast({ variant: "destructive", title: "Deck not found" });
            router.push("/decks");
        }
    }
  }, [deckId, router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDeckName: "",
      newDeckDescription: "",
      inputType: "text",
      documentText: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(file.type !== 'application/pdf') {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Please upload a PDF file."});
        form.setValue("documentFile", null);
        setFileName("");
        return;
      }
      form.setValue("documentFile", file);
      setFileName(file.name);
    }
  };
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (!currentUser.id) {
          toast({ variant: "destructive", title: "Not Logged In", description: "You must be logged in to create a deck." });
          setIsGenerating(false);
          return;
      }

      let targetDeckId = deckId;
      let deckName = deck?.name;

      if (!isAddingToExistingDeck) {
        if (!values.newDeckName || values.newDeckName.length < 3) {
            toast({ variant: "destructive", title: "Validation Error", description: "Deck name must be at least 3 characters." });
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
        targetDeckId = newDeck.id;
        deckName = newDeck.name;
      }


      let result: Flashcard[] = [];
      if (values.inputType === 'text' && values.documentText) {
          result = await generateFlashcards({ documentText: values.documentText });
      } else if (values.inputType === 'pdf' && values.documentFile) {
          const dataUri = await fileToDataUri(values.documentFile);
          result = await generateFlashcards({ documentFile: dataUri });
      } else {
        toast({ variant: "destructive", title: "No content provided." });
        setIsGenerating(false);
        return;
      }
      
      if (result && result.length > 0) {
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
          description: `Successfully created ${result.length} flashcards for the "${deckName}" deck.`,
        });
        
        router.push(`/decks/${targetDeckId}`);
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: "Could not generate flashcards from the provided content. Please try again.",
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

  const pageTitle = isAddingToExistingDeck ? `Add Cards to "${deck?.name}"` : "Create New AI Deck";
  const pageDescription = isAddingToExistingDeck 
    ? "Paste your content or upload a PDF to add more cards to this deck."
    : "Provide a deck name, paste your content or upload a PDF, and let AI do the rest.";
  const buttonText = isAddingToExistingDeck ? "Add Cards" : "Create Deck & Generate";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground">{pageDescription}</p>
        </div>
      </div>
       <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {!isAddingToExistingDeck && (
                <Card className="mb-6">
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
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="text" className="mt-6" onValueChange={(value) => form.setValue('inputType', value as 'text' | 'pdf')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text"><FileText className="mr-2 h-4 w-4" /> Paste Text</TabsTrigger>
                    <TabsTrigger value="pdf"><Upload className="mr-2 h-4 w-4" /> Upload PDF</TabsTrigger>
                </TabsList>
                <TabsContent value="text">
                     <Card>
                        <CardHeader>
                            <CardTitle>Paste Content</CardTitle>
                            <CardDescription>Paste your document, article, or notes here to generate flashcards.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <FormField
                                control={form.control}
                                name="documentText"
                                render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                    <Textarea
                                        placeholder="Paste your content here..."
                                        className="min-h-[250px] resize-y"
                                        {...field}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                     </Card>
                </TabsContent>
                <TabsContent value="pdf">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload PDF</CardTitle>
                            <CardDescription>Upload a PDF document to automatically generate flashcards.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <FormField
                                control={form.control}
                                name="documentFile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <div className="flex items-center justify-center w-full">
                                                <label htmlFor="dropzone-file" className={cn("flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80", {
                                                    "border-primary": !!fileName
                                                })}>
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                                        {fileName ? (
                                                            <p className="font-semibold text-primary">{fileName}</p>
                                                        ) : (
                                                            <>
                                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                                <p className="text-xs text-muted-foreground">PDF only (MAX. 5MB)</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <Input id="dropzone-file" type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
                                                </label>
                                            </div> 
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <div className="mt-6">
                <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                    </>
                    ) : (
                    <>
                        <BookPlus className="mr-2 h-4 w-4" />
                        {buttonText}
                    </>
                    )}
                </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}

    