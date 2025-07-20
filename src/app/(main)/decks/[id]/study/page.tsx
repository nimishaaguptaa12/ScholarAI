"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Flashcard as FlashcardComponent } from "@/components/flashcard";
import { ArrowLeft, Check, X, Trophy } from "lucide-react";
import type { Deck, Flashcard } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scheduleFlashcardReview } from "@/lib/actions";

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

  useEffect(() => {
    if (id) {
      const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
      const currentDeck = allDecks.find((d) => d.id === id);

      if (currentDeck) {
        setDeck(currentDeck);
        const storedFlashcards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
        const deckCards = storedFlashcards.filter((f) => f.deckId === id);
        setAllFlashcards(storedFlashcards);
        setStudyQueue(deckCards);
      } else {
        router.push("/decks");
      }
    }
  }, [id, router]);

  const currentCard = useMemo(() => studyQueue[currentIndex], [studyQueue, currentIndex]);
  const progress = useMemo(() => (currentIndex / studyQueue.length) * 100, [currentIndex, studyQueue]);

  const handleReview = async (correct: boolean) => {
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
    
    const { nextReviewDate } = await scheduleFlashcardReview({
        flashcardId: currentCard.id,
        reviewHistory: updatedCard.reviewHistory,
        difficulty: currentCard.difficulty,
    });
    updatedCard.nextReviewDate = nextReviewDate;
    
    const updatedAllCards = allFlashcards.map(c => c.id === currentCard.id ? updatedCard : c);
    localStorage.setItem("flashcards", JSON.stringify(updatedAllCards));
    setAllFlashcards(updatedAllCards);

    if (currentIndex + 1 < studyQueue.length) {
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      }, 500);
    } else {
      setIsFinished(true);
    }
  };

  if (!deck || studyQueue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold">No cards to study in this deck.</h2>
        <Button onClick={() => router.push(`/decks/${id}`)} className="mt-4">Back to Deck</Button>
      </div>
    );
  }

  if (isFinished) {
    const total = sessionResults.correct + sessionResults.incorrect;
    const score = total > 0 ? Math.round((sessionResults.correct / total) * 100) : 0;

    return (
        <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
                <CardTitle className="flex justify-center items-center gap-2 text-2xl">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    Session Complete!
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-4xl font-bold">{score}%</p>
                <div className="flex justify-around">
                    <div>
                        <p className="text-lg font-semibold text-green-500">{sessionResults.correct}</p>
                        <p className="text-sm text-muted-foreground">Correct</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-red-500">{sessionResults.incorrect}</p>
                        <p className="text-sm text-muted-foreground">Incorrect</p>
                    </div>
                </div>
                <div className="flex gap-4 pt-4">
                    <Button onClick={() => router.push(`/decks/${id}`)} className="flex-1">Back to Deck</Button>
                    <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">Study Again</Button>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={() => router.push(`/decks/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          End Session
        </Button>
        <div className="text-lg font-semibold">
          {currentIndex + 1} / {studyQueue.length}
        </div>
      </div>
      <Progress value={progress} className="mb-8" />
      
      <div className="flex-grow flex items-center justify-center">
        <FlashcardComponent
            question={currentCard.question}
            answer={currentCard.answer}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
        />
      </div>

      <div className="mt-8 flex justify-around items-center transition-opacity duration-300" style={{ opacity: isFlipped ? 1 : 0.2, pointerEvents: isFlipped ? 'auto' : 'none' }}>
        <Button variant="destructive" size="lg" className="rounded-full h-20 w-20 flex flex-col gap-1" onClick={() => handleReview(false)}>
            <X className="h-8 w-8" />
            <span>Didn't know</span>
        </Button>
        <Button variant="ghost" className="text-muted-foreground" onClick={() => setIsFlipped(false)}>Flip back</Button>
        <Button variant="default" size="lg" className="rounded-full h-20 w-20 bg-green-500 hover:bg-green-600 flex flex-col gap-1" onClick={() => handleReview(true)}>
            <Check className="h-8 w-8" />
            <span>Knew it</span>
        </Button>
      </div>
    </div>
  );
}
