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
import { Zap, Loader2, BookPlus, FileText, Upload } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { generateFlashcards } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  newDeckName: z.string().min(3, {
    message: "Deck name must be at least 3 characters.",
  }),
  newDeckDescription: z.string().optional(),
  inputType: z.enum(['text', 'pdf']),
  documentText: z.string().optional(),
  documentFile: z.any().optional(),
}).refine(data => {
    if (data.inputType === 'text') {
        return !!data.documentText && data.documentText.length >= 50;
    }
    if (data.inputType === 'pdf') {
        return !!data.documentFile;
    }
    return false;
}, {
    message: "Please either paste text (min 50 chars) or upload a PDF file.",
    path: ["documentText"], // assign error to a field
});

export default function CreatePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();
  const router = useRouter();

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

      const newDeck: Deck = {
          id: Date.now().toString(),
          name: values.newDeckName,
          description: values.newDeckDescription || '',
          userId: currentUser.id,
      };
      
      const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
      localStorage.setItem("decks", JSON.stringify([...allDecks, newDeck]));
      const targetDeckId = newDeck.id;

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
          description: `Successfully created the "${newDeck.name}" deck with ${result.length} flashcards.`,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Zap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New AI Deck</h1>
          <p className="text-muted-foreground">
            Provide a deck name, paste your content or upload a PDF, and let AI do the rest.
          </p>
        </div>
      </div>
       <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
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
                                    <FormDescription>
                                        Enter at least 50 characters.
                                    </FormDescription>
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
                        Create Deck & Generate
                    </>
                    )}
                </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}