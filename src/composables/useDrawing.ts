// Drawing composable for Canvas
import { type Ref } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'
import { useToolStore } from '@/stores/tools'
import type { Element } from '@/types'

export function useDrawing(
  mainCanvasRef: Ref<HTMLCanvasElement | undefined>,
  previewCanvasRef: Ref<HTMLCanvasElement | undefined>,
  _oledWidth: Ref<number>,
  _oledHeight: Ref<number>
) {
  const projectStore = useProjectStore()
  const canvasStore = useCanvasStore()
  const toolStore = useToolStore()

  // Render all elements to main canvas
  function renderElements() {
    const canvas = mainCanvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and fill with background
    ctx.fillStyle = projectStore.currentPage.backgroundColor === 1 ? '#00ff00' : '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Sort elements by zIndex and draw
    const sortedElements = [...projectStore.currentPage.elements].sort((a, b) => a.zIndex - b.zIndex)

    for (const element of sortedElements) {
      if (element.visible) {
        drawElement(ctx, element)
      }
    }
  }

  // Draw a single element
  function drawElement(ctx: CanvasRenderingContext2D, element: Element) {
    const color = element.properties.color === 1 ? '#00ff00' : '#1a1a1a'

    switch (element.type) {
      case 'pixel':
        ctx.fillStyle = color
        ctx.fillRect(element.x, element.y, 1, 1)
        break

      case 'line':
        drawLine(ctx, element.x, element.y,
          element.x + (element.properties.x2 || 0),
          element.y + (element.properties.y2 || 0), color)
        break

      case 'rect':
        if (element.properties.fill) {
          drawFilledRect(ctx, element.x, element.y, element.width, element.height, color)
        } else {
          drawRect(ctx, element.x, element.y, element.width, element.height, color)
        }
        break

      case 'circle': {
        const r = Math.floor(element.width / 2)
        const cx = element.x + r
        const cy = element.y + r
        if (element.properties.fill) {
          drawFilledCircle(ctx, cx, cy, r, color)
        } else {
          drawCircle(ctx, cx, cy, r, color)
        }
        break
      }

      case 'ellipse': {
        const rx = Math.floor(element.width / 2)
        const ry = Math.floor(element.height / 2)
        const cx = element.x + rx
        const cy = element.y + ry
        if (element.properties.fill) {
          drawFilledEllipse(ctx, cx, cy, rx, ry, color)
        } else {
          drawEllipse(ctx, cx, cy, rx, ry, color)
        }
        break
      }

      case 'roundRect': {
        const radius = Math.min(
          element.properties.radius || 4,
          Math.floor(element.width / 2),
          Math.floor(element.height / 2)
        )
        if (element.properties.fill) {
          drawFilledRoundRect(ctx, element.x, element.y, element.width, element.height, radius, color)
        } else {
          drawRoundRect(ctx, element.x, element.y, element.width, element.height, radius, color)
        }
        break
      }

      case 'text':
        if (element.properties.text) {
          drawText(ctx, element.x, element.y, element.properties.text,
            element.properties.fontSize || 8, color, element.properties.align || 'left',
            element.width)
        }
        break

      case 'image':
        if (element.properties.imageData) {
          drawImage(ctx, element)
        }
        break
    }
  }

  // Bresenham line algorithm
  function drawLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string) {
    ctx.fillStyle = color
    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy

    while (true) {
      ctx.fillRect(x0, y0, 1, 1)
      if (x0 === x1 && y0 === y1) break
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; x0 += sx }
      if (e2 < dx) { err += dx; y0 += sy }
    }
  }

  function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color
    // Top and bottom
    for (let i = 0; i <= w; i++) {
      ctx.fillRect(x + i, y, 1, 1)
      ctx.fillRect(x + i, y + h, 1, 1)
    }
    // Left and right
    for (let i = 0; i <= h; i++) {
      ctx.fillRect(x, y + i, 1, 1)
      ctx.fillRect(x + w, y + i, 1, 1)
    }
  }

  function drawFilledRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color
    for (let j = 0; j <= h; j++) {
      for (let i = 0; i <= w; i++) {
        ctx.fillRect(x + i, y + j, 1, 1)
      }
    }
  }

  function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
    ctx.fillStyle = color
    let x = r
    let y = 0
    let err = 0

    while (x >= y) {
      ctx.fillRect(cx + x, cy + y, 1, 1)
      ctx.fillRect(cx + y, cy + x, 1, 1)
      ctx.fillRect(cx - y, cy + x, 1, 1)
      ctx.fillRect(cx - x, cy + y, 1, 1)
      ctx.fillRect(cx - x, cy - y, 1, 1)
      ctx.fillRect(cx - y, cy - x, 1, 1)
      ctx.fillRect(cx + y, cy - x, 1, 1)
      ctx.fillRect(cx + x, cy - y, 1, 1)

      y++
      if (err <= 0) err += 2 * y + 1
      if (err > 0) { x--; err -= 2 * x + 1 }
    }
  }

  function drawFilledCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
    ctx.fillStyle = color
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          ctx.fillRect(cx + x, cy + y, 1, 1)
        }
      }
    }
  }

  function drawEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string) {
    ctx.fillStyle = color
    const rx2 = rx * rx
    const ry2 = ry * ry

    // Draw using midpoint ellipse algorithm
    let x = 0
    let y = ry
    let px = 0
    let py = 2 * rx2 * y

    // Region 1
    let p = ry2 - rx2 * ry + 0.25 * rx2
    while (px < py) {
      ctx.fillRect(cx + x, cy + y, 1, 1)
      ctx.fillRect(cx - x, cy + y, 1, 1)
      ctx.fillRect(cx + x, cy - y, 1, 1)
      ctx.fillRect(cx - x, cy - y, 1, 1)
      x++
      px += 2 * ry2
      if (p < 0) {
        p += ry2 + px
      } else {
        y--
        py -= 2 * rx2
        p += ry2 + px - py
      }
    }

    // Region 2
    p = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2
    while (y >= 0) {
      ctx.fillRect(cx + x, cy + y, 1, 1)
      ctx.fillRect(cx - x, cy + y, 1, 1)
      ctx.fillRect(cx + x, cy - y, 1, 1)
      ctx.fillRect(cx - x, cy - y, 1, 1)
      y--
      py -= 2 * rx2
      if (p > 0) {
        p += rx2 - py
      } else {
        x++
        px += 2 * ry2
        p += rx2 - py + px
      }
    }
  }

  function drawFilledEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string) {
    ctx.fillStyle = color
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
          ctx.fillRect(cx + x, cy + y, 1, 1)
        }
      }
    }
  }

  function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
    ctx.fillStyle = color
    // Horizontal lines
    for (let i = r; i <= w - r; i++) {
      ctx.fillRect(x + i, y, 1, 1)
      ctx.fillRect(x + i, y + h, 1, 1)
    }
    // Vertical lines
    for (let i = r; i <= h - r; i++) {
      ctx.fillRect(x, y + i, 1, 1)
      ctx.fillRect(x + w, y + i, 1, 1)
    }
    // Corners
    drawCornerArc(ctx, x + r, y + r, r, 2, color)
    drawCornerArc(ctx, x + w - r, y + r, r, 1, color)
    drawCornerArc(ctx, x + r, y + h - r, r, 3, color)
    drawCornerArc(ctx, x + w - r, y + h - r, r, 0, color)
  }

  function drawFilledRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string) {
    ctx.fillStyle = color
    // Center rectangle
    for (let j = 0; j <= h; j++) {
      for (let i = 0; i <= w; i++) {
        const inCorner = (
          (i < r && j < r && (i - r) * (i - r) + (j - r) * (j - r) > r * r) ||
          (i > w - r && j < r && (i - w + r) * (i - w + r) + (j - r) * (j - r) > r * r) ||
          (i < r && j > h - r && (i - r) * (i - r) + (j - h + r) * (j - h + r) > r * r) ||
          (i > w - r && j > h - r && (i - w + r) * (i - w + r) + (j - h + r) * (j - h + r) > r * r)
        )
        if (!inCorner) {
          ctx.fillRect(x + i, y + j, 1, 1)
        }
      }
    }
  }

  function drawCornerArc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, quadrant: number, color: string) {
    ctx.fillStyle = color
    let x = r
    let y = 0
    let err = 0

    while (x >= y) {
      switch (quadrant) {
        case 0: // Bottom-right
          ctx.fillRect(cx + x, cy + y, 1, 1)
          ctx.fillRect(cx + y, cy + x, 1, 1)
          break
        case 1: // Top-right
          ctx.fillRect(cx + x, cy - y, 1, 1)
          ctx.fillRect(cx + y, cy - x, 1, 1)
          break
        case 2: // Top-left
          ctx.fillRect(cx - x, cy - y, 1, 1)
          ctx.fillRect(cx - y, cy - x, 1, 1)
          break
        case 3: // Bottom-left
          ctx.fillRect(cx - x, cy + y, 1, 1)
          ctx.fillRect(cx - y, cy + x, 1, 1)
          break
      }
      y++
      if (err <= 0) err += 2 * y + 1
      if (err > 0) { x--; err -= 2 * x + 1 }
    }
  }

  // Simple bitmap font rendering
  function drawText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fontSize: number, color: string, align: string, boxWidth?: number) {
    ctx.fillStyle = color
    const charWidth = Math.ceil(fontSize * 0.6)
    const textWidth = text.length * charWidth

    let startX = x
    if (align === 'center' && boxWidth) {
      startX = x + Math.floor((boxWidth - textWidth) / 2)
    } else if (align === 'right' && boxWidth) {
      startX = x + boxWidth - textWidth
    }

    // Simple placeholder rendering - actual font rendering would use bitmap font data
    for (let i = 0; i < text.length; i++) {
      const charX = startX + i * charWidth
      // Draw a simple rectangle as placeholder for each character
      for (let py = 0; py < fontSize; py++) {
        for (let px = 0; px < charWidth - 1; px++) {
          // Simple pattern based on character code
          const charCode = text.charCodeAt(i)
          if ((charCode + px + py) % 3 !== 0) {
            ctx.fillRect(charX + px, y + py, 1, 1)
          }
        }
      }
    }
  }

  function drawImage(ctx: CanvasRenderingContext2D, element: Element) {
    const img = new Image()
    img.src = element.properties.imageData!

    // Create offscreen canvas for processing
    const offscreen = document.createElement('canvas')
    offscreen.width = element.width
    offscreen.height = element.height
    const offCtx = offscreen.getContext('2d')
    if (!offCtx) return

    img.onload = () => {
      offCtx.drawImage(img, 0, 0, element.width, element.height)
      const imageData = offCtx.getImageData(0, 0, element.width, element.height)
      const threshold = element.properties.threshold || 128

      // Binary conversion
      for (let y = 0; y < element.height; y++) {
        for (let x = 0; x < element.width; x++) {
          const idx = (y * element.width + x) * 4
          const gray = (imageData.data[idx] + imageData.data[idx + 1] + imageData.data[idx + 2]) / 3
          if (gray < threshold) {
            ctx.fillStyle = '#00ff00'
            ctx.fillRect(element.x + x, element.y + y, 1, 1)
          }
        }
      }
    }
  }

  // Render preview (during drawing)
  function renderPreview(textPreviewRect?: { x: number; y: number; width: number; height: number } | null) {
    const canvas = previewCanvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Text box preview
    if (textPreviewRect) {
      ctx.save()
      ctx.setLineDash([3, 3])
      ctx.strokeStyle = '#00aaff'
      ctx.strokeRect(textPreviewRect.x, textPreviewRect.y, textPreviewRect.width, textPreviewRect.height)
      ctx.restore()
      return
    }

    if (!canvasStore.isDrawing || !canvasStore.drawStartPoint || !canvasStore.drawCurrentPoint) return

    const start = canvasStore.drawStartPoint
    const current = canvasStore.drawCurrentPoint
    const color = toolStore.toolOptions.color === 1 ? '#00ff00' : '#1a1a1a'

    const tool = toolStore.currentTool

    switch (tool) {
      case 'line':
        drawLine(ctx, start.x, start.y, current.x, current.y, color)
        break
      case 'rect':
        if (toolStore.toolOptions.fill) {
          drawFilledRect(ctx, Math.min(start.x, current.x), Math.min(start.y, current.y),
            Math.abs(current.x - start.x), Math.abs(current.y - start.y), color)
        } else {
          drawRect(ctx, Math.min(start.x, current.x), Math.min(start.y, current.y),
            Math.abs(current.x - start.x), Math.abs(current.y - start.y), color)
        }
        break
      case 'circle': {
        const radius = Math.round(Math.sqrt(Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2)))
        if (toolStore.toolOptions.fill) {
          drawFilledCircle(ctx, start.x, start.y, radius, color)
        } else {
          drawCircle(ctx, start.x, start.y, radius, color)
        }
        break
      }
      case 'ellipse': {
        const rx = Math.abs(current.x - start.x)
        const ry = Math.abs(current.y - start.y)
        if (toolStore.toolOptions.fill) {
          drawFilledEllipse(ctx, start.x, start.y, rx, ry, color)
        } else {
          drawEllipse(ctx, start.x, start.y, rx, ry, color)
        }
        break
      }
      case 'roundRect': {
        const w = Math.abs(current.x - start.x)
        const h = Math.abs(current.y - start.y)
        const r = Math.min(toolStore.toolOptions.cornerRadius, Math.floor(w / 2), Math.floor(h / 2))
        if (toolStore.toolOptions.fill) {
          drawFilledRoundRect(ctx, Math.min(start.x, current.x), Math.min(start.y, current.y), w, h, r, color)
        } else {
          drawRoundRect(ctx, Math.min(start.x, current.x), Math.min(start.y, current.y), w, h, r, color)
        }
        break
      }
    }
  }

  return {
    renderElements,
    renderPreview,
    drawElement,
    drawLine,
    drawRect,
    drawFilledRect,
    drawCircle,
    drawFilledCircle,
    drawEllipse,
    drawFilledEllipse,
    drawRoundRect,
    drawFilledRoundRect
  }
}
