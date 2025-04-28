import { CanvasDrawingApp } from "./CanvasDrawingApp";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Canvas Drawing App</h1>
        <CanvasDrawingApp />
      </div>
    </main>
  )
}
