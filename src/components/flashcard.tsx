"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
  isImportant?: boolean;
  onToggleImportant?: () => void;
}

export function Flashcard({ question, answer, isFlipped, onFlip, isImportant, onToggleImportant }: FlashcardProps) {
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the card from flipping when the star is clicked
    onToggleImportant?.();
  }

  return (
    <div
      className="w-full h-full max-w-xl aspect-[5/3] [perspective:1000px] cursor-pointer"
      onClick={onFlip}
    >
      <div
        className={cn(
          "relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d]",
          { "[transform:rotateY(180deg)]": isFlipped }
        )}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden]">
          <Card className="w-full h-full flex items-center justify-center p-6 border-2 border-border shadow-md hover:shadow-xl transition-shadow">
            <button
              onClick={handleStarClick}
              className="absolute top-4 right-4 text-muted-foreground hover:text-yellow-400 transition-colors z-10 p-2"
              aria-label="Mark as important"
            >
              <Star className={cn("h-6 w-6", isImportant && "fill-yellow-400 text-yellow-400")} />
            </button>
            <CardContent className="p-0">
               <p className="text-muted-foreground text-sm mb-4">QUESTION</p>
               <p className="text-2xl md:text-3xl font-semibold text-card-foreground">
                {question}
                </p>
            </CardContent>
          </Card>
        </div>
        {/* Back of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <Card className="w-full h-full flex items-center justify-center p-6 bg-secondary border-2 border-primary/50 shadow-md">
             <button
              onClick={handleStarClick}
              className="absolute top-4 right-4 text-muted-foreground hover:text-yellow-400 transition-colors z-10 p-2"
              aria-label="Mark as important"
            >
              <Star className={cn("h-6 w-6", isImportant && "fill-yellow-400 text-yellow-400")} />
            </button>
            <CardContent className="p-0">
               <p className="text-primary/80 text-sm mb-4 font-medium">ANSWER</p>
               <p className="text-xl md:text-2xl font-medium text-secondary-foreground">
                {answer}
               </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
