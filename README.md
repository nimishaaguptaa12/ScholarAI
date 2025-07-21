# 🧠 ScholarAI - AI-Powered Flashcards

**ScholarAI** is a modern web application designed to revolutionize the way you study. By leveraging the power of generative AI, ScholarAI transforms your notes, documents, and even PDFs into interactive flashcard decks, helping you learn faster and remember longer.

---

## ✨ Key Features

- **🤖 AI-Powered Flashcard Generation**: Automatically create comprehensive flashcard decks from pasted text or uploaded PDF documents.
- **🧠 Spaced Repetition Learning**: An intelligent algorithm schedules card reviews at optimal intervals to maximize long-term memory retention.
- **💬 Interactive AI Tutor**: Engage in a dynamic conversation with a built-in AI tutor to deepen your understanding of complex topics. Ask questions, get explanations, and test your knowledge on any subject.
- **📁 PDF & Text Support**: Flexible input options allow you to generate study materials from a wide range of sources.
- **📈 Progress Tracking**: Visualize your learning progress with a dashboard that tracks your study habits and performance over time.
- **🎨 Modern & Responsive UI**: A clean, intuitive, and mobile-friendly interface built with the latest web technologies.

---

## 🛠️ Tech Stack

This project is built with a modern, type-safe, and performant technology stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI Library**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Library**: [ShadCN UI](https://ui.shadcn.com/)
- **Generative AI**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- `npm` or `yarn`

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

The codebase is organized to be clean and maintainable:

```
/
├── src/
│   ├── app/                # Next.js App Router: pages and layouts
│   ├── components/         # Reusable React components (UI and custom)
│   ├── ai/                 # Genkit flows and AI-related logic
│   │   ├── flows/          # Specific AI tasks (generation, tutoring)
│   │   └── genkit.ts       # Genkit configuration
│   ├── lib/                # Utility functions, actions, and type definitions
│   └── hooks/              # Custom React hooks
├── public/                 # Static assets
└── tailwind.config.ts      # Tailwind CSS configuration
```
