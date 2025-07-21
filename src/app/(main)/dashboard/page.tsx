"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart as BarChartIcon, Book, Target, Zap } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { type Deck, type Flashcard } from "@/lib/types";
import { subDays, format, startOfDay, isWithinInterval } from 'date-fns';

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
};

export default function DashboardPage() {
    const [stats, setStats] = useState({ totalDecks: 0, totalCards: 0, dueToday: 0 });
    const [recentDecks, setRecentDecks] = useState<Deck[]>([]);
    const [averageScore, setAverageScore] = useState<number | null>(null);
    const [weeklyProgress, setWeeklyProgress] = useState<{date: string; score: number | null}[]>([]);

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (currentUser.id) {
            const allDecks: Deck[] = JSON.parse(localStorage.getItem("decks") || "[]");
            const userDecks = allDecks.filter(d => d.userId === currentUser.id);
            const allCards: Flashcard[] = JSON.parse(localStorage.getItem("flashcards") || "[]");
            const userCards = allCards.filter(c => userDecks.some(d => d.id === c.deckId));
            
            const today = startOfDay(new Date());

            const dueCards = userCards.filter(card => {
                if (!card.nextReviewDate) return true; // Review new cards immediately
                const nextReview = startOfDay(new Date(card.nextReviewDate));
                return nextReview <= today;
            });
            
            setStats({ totalDecks: userDecks.length, totalCards: userCards.length, dueToday: dueCards.length });
            setRecentDecks(userDecks.slice(-3).reverse());

            // Calculate weekly progress and average score
            const sevenDaysAgo = startOfDay(subDays(new Date(), 6));
            const now = new Date();

            const recentReviews = userCards
                .flatMap(card => card.reviewHistory)
                .filter(review => isWithinInterval(new Date(review.date), { start: sevenDaysAgo, end: now }));
            
            if(recentReviews.length > 0) {
                const correctReviews = recentReviews.filter(r => r.correct).length;
                setAverageScore(Math.round((correctReviews / recentReviews.length) * 100));
            } else {
                setAverageScore(null);
            }

            const dailyScores: { [key: string]: { correct: number; total: number } } = {};
            const last7Days = Array.from({ length: 7 }).map((_, i) => startOfDay(subDays(now, i)));
            
            last7Days.forEach(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                dailyScores[dayStr] = { correct: 0, total: 0 };
            });

            recentReviews.forEach(review => {
                const dayStr = format(startOfDay(new Date(review.date)), 'yyyy-MM-dd');
                if(dailyScores[dayStr]) {
                    dailyScores[dayStr].total += 1;
                    if(review.correct) {
                        dailyScores[dayStr].correct += 1;
                    }
                }
            });

            const progressData = last7Days.reverse().map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const data = dailyScores[dayStr];
                const score = data.total > 0 ? Math.round((data.correct / data.total) * 100) : null;
                return {
                    date: format(day, 'E'),
                    score: score,
                };
            });
            setWeeklyProgress(progressData);
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
            <div className="text-2xl font-bold">{averageScore !== null ? `${averageScore}%` : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Based on last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards to Review</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueToday} Cards</div>
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
             {weeklyProgress.some(d => d.score !== null) ? (
                <ChartContainer config={chartConfig} className="h-64 w-full">
                <BarChart data={weeklyProgress} accessibilityLayer margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis
                       domain={[0, 100]}
                       tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="score" fill="var(--color-score)" radius={4} />
                </BarChart>
                </ChartContainer>
             ) : (
                <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">No study data yet. Complete a session to see your progress!</p>
                </div>
             )}
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
