"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ question, answer, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="w-full h-full aspect-[3/2] [perspective:1000px]"
      onClick={onFlip}
    >
      <div
        className={cn(
          "relative w-full h-full text-center transition-transform duration-700 [transform-style:preserve-3d]",
          { "[transform:rotateY(180deg)]": isFlipped }
        )}
      >
        {/* Front of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden]">
          <Card className="w-full h-full flex items-center justify-center p-6 bg-card">
            <p className="text-2xl md:text-3xl font-semibold text-card-foreground">
              {question}
            </p>
          </Card>
        </div>
        {/* Back of the card */}
        <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <Card className="w-full h-full flex items-center justify-center p-6 bg-primary/20">
            <p className="text-xl md:text-2xl font-medium text-foreground">
              {answer}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
