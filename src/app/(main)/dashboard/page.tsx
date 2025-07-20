"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, Book, Target, Zap } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart as RechartsBarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Deck, type Flashcard } from "@/lib/types";

const chartData = [
  { date: "Mon", score: 80 },
  { date: "Tue", score: 92 },
  { date: "Wed", score: 75 },
  { date: "Thu", score: 88 },
  { date: "Fri", score: 95 },
  { date: "Sat", score: 82 },
  { date: "Sun", score: 90 },
];

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
};

export default function DashboardPage() {
    const [stats, setStats] = useState({ totalDecks: 0, totalCards: 0 });
    const [recentDecks, setRecentDecks] = useState<Deck[]>([]);

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (currentUser.id) {
            const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
            const userDecks = allDecks.filter(d => d.userId === currentUser.id);
            const allCards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
            const userCards = allCards.filter(c => userDecks.some(d => d.id === c.deckId));
            
            setStats({ totalDecks: userDecks.length, totalCards: userCards.length });
            setRecentDecks(userDecks.slice(0, 3));
        }
    }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
            <Link href="/create">
                <Zap className="mr-2 h-4 w-4" />
                New AI Deck
            </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDecks}</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flashcards</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCards}</div>
            <p className="text-xs text-muted-foreground">Ready for you to study</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88%</div>
            <p className="text-xs text-muted-foreground">Based on last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Review</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Cards</div>
            <p className="text-xs text-muted-foreground">Due for review today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Your quiz scores from the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <RechartsBarChart data={chartData} accessibilityLayer>
                <ChartTooltip
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="score" fill="var(--color-score)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Decks</CardTitle>
            <CardDescription>Jump back into your recent study materials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDecks.length > 0 ? recentDecks.map(deck => (
                 <Link href={`/decks/${deck.id}`} key={deck.id} className="block">
                    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-secondary transition-colors">
                        <div>
                            <p className="font-semibold">{deck.name}</p>
                            <p className="text-sm text-muted-foreground">{deck.description}</p>
                        </div>
                        <Button variant="ghost" size="sm">Study</Button>
                    </div>
                </Link>
            )) : <p className="text-sm text-muted-foreground text-center py-8">No decks created yet. Create one to get started!</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
