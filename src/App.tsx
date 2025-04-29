import CanvasDrawingApp from "@/components/canvas-drawing-app"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-7xl">
        <h1 className="text-3xl font-bold mb-4">Canvas Drawing App</h1>
        <p className="mb-6 text-muted-foreground">Place objects, zoom, and pan around the canvas.</p>
        <CanvasDrawingApp />
      </div>
    </main>
  )
}
