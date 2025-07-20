"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { PlusCircle, BookOpen, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Deck } from "@/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";

function CreateDeckDialog({ onDeckCreated }: { onDeckCreated: (deck: Deck) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleCreate = () => {
    if (name.trim() === "") {
      toast({ variant: "destructive", title: "Deck name is required." });
      return;
    }
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        toast({ variant: "destructive", title: "You must be logged in."});
        return;
    }

    const newDeck: Deck = {
      id: Date.now().toString(),
      name,
      description,
      userId: currentUser.id,
    };

    const decks = JSON.parse(localStorage.getItem("decks") || "[]");
    localStorage.setItem("decks", JSON.stringify([...decks, newDeck]));
    onDeckCreated(newDeck);
    toast({ title: "Deck Created!", description: `"${name}" has been created.` });
    setName("");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Deck
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>
            Give your new deck a name and an optional description.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g., Biology Chapter 5" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="e.g., Key terms and concepts" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreate}>Create Deck</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (currentUser) {
        const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
        setDecks(allDecks.filter(d => d.userId === currentUser.id));
    }
  }, []);

  const addDeck = (deck: Deck) => {
    setDecks((prev) => [...prev, deck]);
  };

  const deleteDeck = (deckId: string) => {
    const updatedDecks = decks.filter(d => d.id !== deckId);
    setDecks(updatedDecks);
    localStorage.setItem("decks", JSON.stringify(updatedDecks));
    
    // Also delete associated flashcards
    const allFlashcards = JSON.parse(localStorage.getItem("flashcards") || "[]");
    const updatedFlashcards = allFlashcards.filter((c: any) => c.deckId !== deckId);
    localStorage.setItem("flashcards", JSON.stringify(updatedFlashcards));

    toast({ title: "Deck Deleted", description: "The deck and all its cards have been removed." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Decks</h1>
        <CreateDeckDialog onDeckCreated={addDeck} />
      </div>
      {decks.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className="flex flex-col">
              <CardHeader className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{deck.name}</CardTitle>
                        <CardDescription>{deck.description || 'No description'}</CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteDeck(deck.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardFooter className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={`/decks/${deck.id}/study`}>
                    <BookOpen className="mr-2 h-4 w-4" /> Study
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="flex-1">
                  <Link href={`/decks/${deck.id}`}>View Deck</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Decks Found</h2>
          <p className="text-muted-foreground mt-2">
            Get started by creating your first flashcard deck.
          </p>
          <div className="mt-6">
            <CreateDeckDialog onDeckCreated={addDeck} />
          </div>
        </div>
      )}
    </div>
  );
}
