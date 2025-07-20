import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Bot, Zap, BookOpen } from 'lucide-react';
import { AppLogo } from '@/components/icons';

const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Auto-Generation',
    description: 'Upload text or PDFs and let our AI create comprehensive flashcard decks for you in seconds.',
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: 'Spaced Repetition',
    description: 'Our smart algorithm schedules reviews at optimal times to maximize memory retention.',
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: 'AI Chat Tutor',
    description: 'Engage in dynamic conversations with your AI tutor to deepen understanding and test your knowledge.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Deck Organization',
    description: 'Easily organize your flashcards into decks, track your progress, and customize your study experience.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <AppLogo className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            FlashGenius
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-grow">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-foreground mb-4">
              Master Any Subject with AI
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              FlashGenius transforms your study materials into interactive flashcards, using intelligent learning techniques to help you learn faster and remember longer.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">Get Started for Free</Link>
            </Button>
          </div>
        </section>

        <section className="bg-secondary/50 py-20 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                A Smarter Way to Study
              </h2>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Discover features designed for efficient and effective learning.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {features.map((feature) => (
                <Card key={feature.title} className="bg-card/80 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300 shadow-lg border-primary/10">
                  <CardHeader className="flex flex-row items-center gap-4">
                    {feature.icon}
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} FlashGenius. All rights reserved.</p>
      </footer>
    </div>
  );
}
