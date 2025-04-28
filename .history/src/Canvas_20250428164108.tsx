"use client"

import { useRef, useState, useEffect, type MouseEvent } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Square, Circle, Triangle, Move, ZoomIn, ZoomOut, Trash2, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Shape = {
  id: string
  type: "rectangle" | "circle" | "triangle"
  x: number
  y: number
  width: number
  height: number
  color: string
}

export function CanvasDrawingApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedTool, setSelectedTool] = useState<"rectangle" | "circle" | "triangle" | "move">("rectangle")
  const [selectedColor, setSelectedColor] = useState("#4f46e5")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedShape, setSelectedShape] = useState<string | null>(null)

  // Draw all shapes on the canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply zoom and pan transformations
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw all shapes
    shapes.forEach((shape) => {
      ctx.fillStyle = shape.color

      if (shape.id === selectedShape) {
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 2 / zoom
      }

      if (shape.type === "rectangle") {
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
        if (shape.id === selectedShape) {
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
        }
      } else if (shape.type === "circle") {
        ctx.beginPath()
        ctx.ellipse(
          shape.x + shape.width / 2,
          shape.y + shape.height / 2,
          shape.width / 2,
          shape.height / 2,
          0,
          0,
          Math.PI * 2,
        )
        ctx.fill()
        if (shape.id === selectedShape) {
          ctx.stroke()
        }
      } else if (shape.type === "triangle") {
        ctx.beginPath()
        ctx.moveTo(shape.x + shape.width / 2, shape.y)
        ctx.lineTo(shape.x, shape.y + shape.height)
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
        ctx.closePath()
        ctx.fill()
        if (shape.id === selectedShape) {
          ctx.stroke()
        }
      }
    })

    ctx.restore()
  }

  // Effect to redraw canvas when shapes, zoom, or pan changes
  useEffect(() => {
    drawCanvas()
  }, [shapes, zoom, pan, selectedShape])

  // Handle canvas click to add shapes
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === "move") return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()

    // Calculate position considering zoom and pan
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    const newShape: Shape = {
      id: Date.now().toString(),
      type: selectedTool,
      x,
      y,
      width: 100,
      height: 100,
      color: selectedColor,
    }

    setShapes([...shapes, newShape])
    setSelectedShape(newShape.id)
  }

  // Handle mouse down for panning or moving shapes
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setIsDragging(true)
    setDragStart({ x: mouseX, y: mouseY })

    if (selectedTool === "move") {
      // Check if clicking on a shape
      const transformedX = (mouseX - pan.x) / zoom
      const transformedY = (mouseY - pan.y) / zoom

      // Check shapes in reverse order (top-most first)
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i]

        if (shape.type === "rectangle") {
          if (
            transformedX >= shape.x &&
            transformedX <= shape.x + shape.width &&
            transformedY >= shape.y &&
            transformedY <= shape.y + shape.height
          ) {
            setSelectedShape(shape.id)
            return
          }
        } else if (shape.type === "circle") {
          const centerX = shape.x + shape.width / 2
          const centerY = shape.y + shape.height / 2
          const radiusX = shape.width / 2
          const radiusY = shape.height / 2

          const dx = (transformedX - centerX) / radiusX
          const dy = (transformedY - centerY) / radiusY

          if (dx * dx + dy * dy <= 1) {
            setSelectedShape(shape.id)
            return
          }
        } else if (shape.type === "triangle") {
          // Simple triangle hit detection
          const x1 = shape.x + shape.width / 2
          const y1 = shape.y
          const x2 = shape.x
          const y2 = shape.y + shape.height
          const x3 = shape.x + shape.width
          const y3 = shape.y + shape.height

          // Check if point is inside triangle using barycentric coordinates
          const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
          const a = ((y2 - y3) * (transformedX - x3) + (x3 - x2) * (transformedY - y3)) / denominator
          const b = ((y3 - y1) * (transformedX - x3) + (x1 - x3) * (transformedY - y3)) / denominator
          const c = 1 - a - b

          if (a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1) {
            setSelectedShape(shape.id)
            return
          }
        }
      }

      // If no shape was clicked, deselect
      setSelectedShape(null)
    }
  }

  // Handle mouse move for panning or moving shapes
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const deltaX = mouseX - dragStart.x
    const deltaY = mouseY - dragStart.y

    if (selectedTool === "move" && selectedShape) {
      // Move the selected shape
      setShapes(
        shapes.map((shape) => {
          if (shape.id === selectedShape) {
            return {
              ...shape,
              x: shape.x + deltaX / zoom,
              y: shape.y + deltaY / zoom,
            }
          }
          return shape
        }),
      )
    } else {
      // Pan the canvas
      setPan({
        x: pan.x + deltaX,
        y: pan.y + deltaY,
      })
    }

    setDragStart({ x: mouseX, y: mouseY })
  }

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle zoom in
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5))
  }

  // Handle zoom out
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.2))
  }

  // Clear all shapes
  const handleClear = () => {
    setShapes([])
    setSelectedShape(null)
  }

  // Download canvas as image
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Create a temporary canvas to draw the full scene
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    // Draw white background
    tempCtx.fillStyle = "white"
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // Copy the current canvas with transformations
    tempCtx.drawImage(canvas, 0, 0)

    // Create download link
    const link = document.createElement("a")
    link.download = "canvas-drawing.png"
    link.href = tempCanvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          <Button
            variant={selectedTool === "rectangle" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("rectangle")}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedTool === "circle" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("circle")}
            title="Circle"
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedTool === "triangle" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("triangle")}
            title="Triangle"
          >
            <Triangle className="h-4 w-4" />
          </Button>
          <Button
            variant={selectedTool === "move" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("move")}
            title="Move"
          >
            <Move className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="color-select" className="text-sm">
            Color:
          </label>
          <Select value={selectedColor} onValueChange={setSelectedColor}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="#4f46e5">Indigo</SelectItem>
              <SelectItem value="#ef4444">Red</SelectItem>
              <SelectItem value="#22c55e">Green</SelectItem>
              <SelectItem value="#3b82f6">Blue</SelectItem>
              <SelectItem value="#f59e0b">Yellow</SelectItem>
              <SelectItem value="#8b5cf6">Purple</SelectItem>
              <SelectItem value="#000000">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1 ml-auto">
          <Button variant="outline" size="icon" onClick={handleClear} title="Clear Canvas">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownload} title="Download">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">Zoom: {(zoom * 100).toFixed(0)}%</span>
        <div className="w-[200px]">
          <Slider
            value={[zoom * 100]}
            min={20}
            max={500}
            step={10}
            onValueChange={(value) => setZoom(value[0] / 100)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-[600px] cursor-crosshair touch-none"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          {selectedTool === "move"
            ? "Click and drag to move shapes or pan the canvas"
            : "Click to place a shape, or use the move tool to reposition objects"}
        </p>
      </div>
    </div>
  )
}
