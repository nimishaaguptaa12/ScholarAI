"use client";

import { TutorChat } from "@/components/tutor-chat";
import { Card } from "@/components/ui/card";

export default function TutorPage() {
  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <TutorChat />
    </Card>
  );
}
