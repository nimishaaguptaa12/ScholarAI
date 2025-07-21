
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Flashcard as FlashcardComponent } from "@/components/flashcard";
import { ArrowLeft, Check, X, Trophy, RefreshCw, MessageCircle } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scheduleFlashcardReview } from "@/lib/actions";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TutorChat } from "@/components/tutor-chat";


export default function StudyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [studyQueue, setStudyQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
      const currentDeck = allDecks.find((d) => d.id === id);

      if (currentDeck) {
        setDeck(currentDeck);
        const storedFlashcards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
        const deckCards = storedFlashcards.filter((f) => f.deckId === id);
        setAllFlashcards(storedFlashcards);
        // Shuffle the cards for a new session
        setStudyQueue(deckCards.sort(() => Math.random() - 0.5));
      } else {
        router.push("/decks");
      }
    }
  }, [id, router]);

  const currentCard = useMemo(() => studyQueue[currentIndex], [studyQueue, currentIndex]);
  const progress = useMemo(() => (currentIndex / studyQueue.length) * 100, [currentIndex, studyQueue]);

  const handleReview = useCallback(async (correct: boolean) => {
    if (!isFlipped) return; // Can only review after flipping

    setSessionResults(prev => ({
        ...prev,
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    const updatedCard: Flashcard = {
        ...currentCard,
        lastReviewed: new Date().toISOString(),
        reviewHistory: [...(currentCard.reviewHistory || []), { date: new Date().toISOString(), correct }],
    };
    
    // Check if currentCard is defined before scheduling review
    if (currentCard) {
        try {
            const { nextReviewDate } = await scheduleFlashcardReview({
                flashcardId: currentCard.id,
                reviewHistory: updatedCard.reviewHistory,
                difficulty: currentCard.difficulty,
            });
            updatedCard.nextReviewDate = nextReviewDate;
        } catch (error) {
            console.error("Failed to schedule flashcard review", error);
        }
    }
    
    const updatedAllCards = allFlashcards.map(c => c.id === currentCard.id ? updatedCard : c);
    localStorage.setItem("flashcards", JSON.stringify(updatedAllCards));
    setAllFlashcards(updatedAllCards);

    if (currentIndex + 1 < studyQueue.length) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }, 300);
    } else {
      setIsFinished(true);
    }
  }, [isFlipped, currentCard, allFlashcards, currentIndex, studyQueue.length]);


  if (!deck) {
    return (
       <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (studyQueue.length === 0 && !deck) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold">Loading study session...</h2>
      </div>
    );
  }

  if (studyQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold">This deck has no cards.</h2>
        <Button onClick={() => router.push(`/decks/${id}`)} className="mt-4">Back to Deck</Button>
      </div>
    );
  }

  if (isFinished) {
    const total = sessionResults.correct + sessionResults.incorrect;
    const score = total > 0 ? Math.round((sessionResults.correct / total) * 100) : 0;

    return (
        <Card className="max-w-2xl mx-auto text-center animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="flex justify-center items-center gap-2 text-3xl">
                    <Trophy className="h-10 w-10 text-yellow-400" />
                    Session Complete!
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-muted-foreground">You finished the "{deck.name}" deck.</p>
                <div className="p-6 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">YOUR SCORE</p>
                    <p className="text-6xl font-bold">{score}%</p>
                </div>
                <div className="flex justify-around">
                    <div className="text-green-600">
                        <p className="text-2xl font-bold">{sessionResults.correct}</p>
                        <p className="text-sm font-medium">Correct</p>
                    </div>
                    <div className="text-destructive">
                        <p className="text-2xl font-bold">{sessionResults.incorrect}</p>
                        <p className="text-sm font-medium">Incorrect</p>
                    </div>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                        <RefreshCw className="mr-2 h-4 w-4" /> Study Again
                    </Button>
                    <Button onClick={() => router.push(`/decks/${id}`)} className="flex-1">Back to Deck</Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
       <header className="mb-6 space-y-2">
        <Button variant="ghost" onClick={() => router.push(`/decks/${id}`)} className="pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" />
          End Session
        </Button>
        <div className="flex items-center justify-between gap-4">
             <div className="flex-1">
                <p className="text-sm text-muted-foreground">Studying Deck</p>
                <h1 className="text-2xl font-bold tracking-tight">{deck?.name}</h1>
             </div>
             <div className="text-lg font-semibold tabular-nums">
                {currentIndex + 1} / {studyQueue.length}
             </div>
        </div>
        <Progress value={progress} />
      </header>
      
      <div className="flex-grow flex items-center justify-center">
        <FlashcardComponent
            question={currentCard.question}
            answer={currentCard.answer}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
        />
      </div>

       <div className="mt-4 -mb-2 flex justify-center">
        {isFlipped && (
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat to learn more
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
              <SheetHeader className="p-6 pb-2">
                <SheetTitle>AI Tutor</SheetTitle>
              </SheetHeader>
              <TutorChat
                className="flex-1"
                initialFlashcard={currentCard}
              />
            </SheetContent>
          </Sheet>
        )}
      </div>

      <div className="mt-8 flex justify-around items-center">
        <Button variant="destructive" size="lg" className="rounded-full h-20 w-20 flex flex-col gap-1 shadow-lg transition-opacity duration-300 disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => handleReview(false)} disabled={!isFlipped}>
            <X className="h-8 w-8" />
            <span className="text-xs">Didn't know</span>
        </Button>
        <Button variant="ghost" className="text-muted-foreground transition-opacity" onClick={() => setIsFlipped(!isFlipped)} disabled={isFlipped}>Flip Card</Button>
        <Button size="lg" className="rounded-full h-20 w-20 bg-green-500 hover:bg-green-600 flex flex-col gap-1 shadow-lg transition-opacity duration-300 disabled:opacity-30 disabled:cursor-not-allowed" onClick={() => handleReview(true)} disabled={!isFlipped}>
            <Check className="h-8 w-8" />
            <span className="text-xs">Knew it</span>
        </Button>
      </div>
    </div>
  );
}
