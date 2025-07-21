"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, Edit, PlusCircle, Trash2, ArrowLeft } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  useEffect(() => {
    if (id) {
      const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
      const currentDeck = allDecks.find((d) => d.id === id);

      if (currentDeck) {
        setDeck(currentDeck);
        const allFlashcards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
        setFlashcards(allFlashcards.filter((f) => f.deckId === id));
      } else {
        toast({ variant: "destructive", title: "Deck not found." });
        router.push("/decks");
      }
    }
  }, [id, router, toast]);

   const deleteFlashcard = (cardId: string) => {
    const updatedFlashcards = flashcards.filter(c => c.id !== cardId);
    setFlashcards(updatedFlashcards);

    const allFlashcards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
    const newAllFlashcards = allFlashcards.filter(c => c.id !== cardId);
    localStorage.setItem("flashcards", JSON.stringify(newAllFlashcards));

    toast({ title: "Flashcard deleted" });
  };

  if (!deck) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Decks
      </Button>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{deck.name}</h1>
          <p className="text-muted-foreground mt-1">{deck.description}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button asChild>
            <Link href={`/decks/${id}/study`}>
              <BookOpen className="mr-2 h-4 w-4" /> Study
            </Link>
          </Button>
          <Button variant="outline" asChild>
             <Link href={`/create?deckId=${id}`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Cards
             </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Flashcards ({flashcards.length})</CardTitle>
          <CardDescription>
            Manage the flashcards in this deck.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Question</TableHead>
                <TableHead className="w-[40%]">Answer</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flashcards.length > 0 ? (
                flashcards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.question}</TableCell>
                    <TableCell>{card.answer}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" disabled>
                          <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteFlashcard(card.id)}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No flashcards in this deck yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    