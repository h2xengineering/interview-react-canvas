"use client"

import { useRef, useState, useEffect, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Circle, Square, Triangle, Star, Move, ZoomIn, ZoomOut, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Shape = {
  id: string
  type: "circle" | "square" | "triangle" | "star"
  x: number
  y: number
  width: number
  height: number
  color: string
}

export default function CanvasDrawingApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedTool, setSelectedTool] = useState<Shape["type"] | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [selectedShape, setSelectedShape] = useState<string | null>(null)

  const colors = [
    "#f87171", // red
    "#fb923c", // orange
    "#facc15", // yellow
    "#4ade80", // green
    "#60a5fa", // blue
    "#a78bfa", // purple
    "#f472b6", // pink
  ]

  // Draw all shapes on the canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    // Draw shapes
    shapes.forEach((shape) => {
      ctx.fillStyle = shape.color
      ctx.strokeStyle = shape.id === selectedShape ? "#000000" : "transparent"
      ctx.lineWidth = 2 / scale

      switch (shape.type) {
        case "circle":
          ctx.beginPath()
          ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          break

        case "square":
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
          if (shape.id === selectedShape) {
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
          }
          break

        case "triangle":
          ctx.beginPath()
          ctx.moveTo(shape.x + shape.width / 2, shape.y)
          ctx.lineTo(shape.x, shape.y + shape.height)
          ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break

        case "star":
          const centerX = shape.x + shape.width / 2
          const centerY = shape.y + shape.height / 2
          const spikes = 5
          const outerRadius = shape.width / 2
          const innerRadius = shape.width / 4

          ctx.beginPath()
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius
            const angle = (Math.PI / spikes) * i
            const x = centerX + Math.cos(angle) * radius
            const y = centerY + Math.sin(angle) * radius

            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break
      }
    })

    ctx.restore()
  }

  // Handle canvas click to add shapes
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool || isPanning) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left - offset.x) / scale
    const mouseY = (e.clientY - rect.top - offset.y) / scale

    const shapeSize = 50
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newShape: Shape = {
      id: Date.now().toString(),
      type: selectedTool,
      x: mouseX - shapeSize / 2,
      y: mouseY - shapeSize / 2,
      width: shapeSize,
      height: shapeSize,
      color: randomColor,
    }

    setShapes([...shapes, newShape])
  }

  // Handle mouse down for panning
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === null) {
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    } else {
      // Check if we clicked on a shape
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left - offset.x) / scale
      const mouseY = (e.clientY - rect.top - offset.y) / scale

      // Check in reverse order (top-most shapes first)
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i]
        let isInside = false

        switch (shape.type) {
          case "circle":
            const centerX = shape.x + shape.width / 2
            const centerY = shape.y + shape.height / 2
            const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2))
            isInside = distance <= shape.width / 2
            break

          case "square":
            isInside =
              mouseX >= shape.x &&
              mouseX <= shape.x + shape.width &&
              mouseY >= shape.y &&
              mouseY <= shape.y + shape.height
            break

          case "triangle":
            // Simple triangle hit detection
            const x1 = shape.x + shape.width / 2
            const y1 = shape.y
            const x2 = shape.x
            const y2 = shape.y + shape.height
            const x3 = shape.x + shape.width
            const y3 = shape.y + shape.height

            // Calculate area of triangle
            const areaOrig = Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2)

            // Calculate areas of three triangles made between the point and the corners
            const area1 = Math.abs((mouseX * (y2 - y3) + x2 * (y3 - mouseY) + x3 * (mouseY - y2)) / 2)
            const area2 = Math.abs((x1 * (mouseY - y3) + mouseX * (y3 - y1) + x3 * (y1 - mouseY)) / 2)
            const area3 = Math.abs((x1 * (y2 - mouseY) + x2 * (mouseY - y1) + mouseX * (y1 - y2)) / 2)

            isInside = Math.abs(areaOrig - (area1 + area2 + area3)) < 0.1
            break

          case "star":
            // Simplified star hit detection (just use a circle)
            const starCenterX = shape.x + shape.width / 2
            const starCenterY = shape.y + shape.height / 2
            const starDistance = Math.sqrt(Math.pow(mouseX - starCenterX, 2) + Math.pow(mouseY - starCenterY, 2))
            isInside = starDistance <= shape.width / 2
            break
        }

        if (isInside) {
          setSelectedShape(shape.id)
          return
        }
      }

      setSelectedShape(null)
    }
  }

  // Handle mouse move for panning
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return

    const dx = e.clientX - lastMousePos.x
    const dy = e.clientY - lastMousePos.y

    setOffset({
      x: offset.x + dx,
      y: offset.y + dy,
    })

    setLastMousePos({ x: e.clientX, y: e.clientY })
  }

  // Handle mouse up to stop panning
  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // Handle zoom in
  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.2, 5))
  }

  // Handle zoom out
  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.2, 0.2))
  }

  // Handle reset view
  const handleResetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  // Handle clear canvas
  const handleClearCanvas = () => {
    setShapes([])
    setSelectedShape(null)
  }

  // Handle delete selected shape
  const handleDeleteSelected = () => {
    if (selectedShape) {
      setShapes(shapes.filter((shape) => shape.id !== selectedShape))
      setSelectedShape(null)
    }
  }

  // Update canvas when shapes, scale, or offset changes
  useEffect(() => {
    drawCanvas()
  }, [shapes, scale, offset, selectedShape])

  // Resize canvas to fit container
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const container = canvas.parentElement
      if (!container) return

      canvas.width = container.clientWidth
      canvas.height = container.clientHeight

      drawCanvas()
    }

    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <div className="flex flex-col h-[80vh] border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          <Button
            variant={selectedTool === "circle" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("circle")}
            title="Circle"
          >
            <Circle className="h-5 w-5" />
          </Button>
          <Button
            variant={selectedTool === "square" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("square")}
            title="Square"
          >
            <Square className="h-5 w-5" />
          </Button>
          <Button
            variant={selectedTool === "triangle" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("triangle")}
            title="Triangle"
          >
            <Triangle className="h-5 w-5" />
          </Button>
          <Button
            variant={selectedTool === "star" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("star")}
            title="Star"
          >
            <Star className="h-5 w-5" />
          </Button>
          <div className="h-6 border-l mx-1"></div>
          <Button
            variant={selectedTool === null ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool(null)}
            title="Pan Tool"
          >
            <Move className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 mr-4">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <div className="w-24">
              <Slider
                value={[scale * 100]}
                min={20}
                max={500}
                step={10}
                onValueChange={(value) => setScale(value[0] / 100)}
              />
            </div>
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground w-12">{Math.round(scale * 100)}%</span>
          </div>

          <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetView} title="Reset View">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="h-6 border-l mx-1"></div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDeleteSelected}
            disabled={!selectedShape}
            title="Delete Selected"
            className={cn(!selectedShape && "text-muted-foreground")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearCanvas} title="Clear Canvas">
            Clear All
          </Button>
        </div>
      </div>

      <div className="relative flex-1 bg-[#f8f9fa] dark:bg-slate-900 overflow-hidden">
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 w-full h-full",
            isPanning ? "cursor-grabbing" : selectedTool ? "cursor-crosshair" : "cursor-grab",
          )}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <div>
            {shapes.length} object{shapes.length !== 1 ? "s" : ""}
          </div>
          <div>{selectedTool ? `Drawing mode: ${selectedTool}` : "Pan mode: Click and drag to move canvas"}</div>
        </div>
      </div>
    </div>
  )
}
