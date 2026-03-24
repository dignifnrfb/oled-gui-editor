// Drawing utility functions for OLED canvas
import type { Element } from '@/types'

// Bresenham's line algorithm
export function getLinePoints(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  let x = x0
  let y = y0

  while (true) {
    points.push({ x, y })
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  return points
}

// Midpoint circle algorithm
export function getCirclePoints(cx: number, cy: number, r: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  let x = r
  let y = 0
  let err = 0

  while (x >= y) {
    points.push({ x: cx + x, y: cy + y })
    points.push({ x: cx + y, y: cy + x })
    points.push({ x: cx - y, y: cy + x })
    points.push({ x: cx - x, y: cy + y })
    points.push({ x: cx - x, y: cy - y })
    points.push({ x: cx - y, y: cy - x })
    points.push({ x: cx + y, y: cy - x })
    points.push({ x: cx + x, y: cy - y })

    y++
    if (err <= 0) {
      err += 2 * y + 1
    }
    if (err > 0) {
      x--
      err -= 2 * x + 1
    }
  }
  return points
}

// Filled circle using scanlines
export function getFilledCirclePoints(cx: number, cy: number, r: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) {
        points.push({ x: cx + x, y: cy + y })
      }
    }
  }
  return points
}

// Ellipse algorithm
export function getEllipsePoints(cx: number, cy: number, rx: number, ry: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  let x = 0
  let y = ry
  let rx2 = rx * rx
  let ry2 = ry * ry
  let twoRx2 = 2 * rx2
  let twoRy2 = 2 * ry2
  let p
  let px = 0
  let py = twoRx2 * y

  // Region 1
  p = Math.round(ry2 - (rx2 * ry) + (0.25 * rx2))
  while (px < py) {
    points.push({ x: cx + x, y: cy + y })
    points.push({ x: cx - x, y: cy + y })
    points.push({ x: cx + x, y: cy - y })
    points.push({ x: cx - x, y: cy - y })
    x++
    px += twoRy2
    if (p < 0) {
      p += ry2 + px
    } else {
      y--
      py -= twoRx2
      p += ry2 + px - py
    }
  }

  // Region 2
  p = Math.round(ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2)
  while (y >= 0) {
    points.push({ x: cx + x, y: cy + y })
    points.push({ x: cx - x, y: cy + y })
    points.push({ x: cx + x, y: cy - y })
    points.push({ x: cx - x, y: cy - y })
    y--
    py -= twoRx2
    if (p > 0) {
      p += rx2 - py
    } else {
      x++
      px += twoRy2
      p += rx2 - py + px
    }
  }
  return points
}

// Draw functions for canvas context
export function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}

export function drawLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string) {
  const points = getLinePoints(x0, y0, x1, y1)
  ctx.fillStyle = color
  for (const p of points) {
    ctx.fillRect(p.x, p.y, 1, 1)
  }
}

export function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: boolean, color: string) {
  ctx.fillStyle = color

  const x1 = Math.min(x, x + w)
  const y1 = Math.min(y, y + h)
  const x2 = Math.max(x, x + w)
  const y2 = Math.max(y, y + h)

  if (fill) {
    for (let py = y1; py <= y2; py++) {
      for (let px = x1; px <= x2; px++) {
        ctx.fillRect(px, py, 1, 1)
      }
    }
  } else {
    // Top and bottom edges
    for (let px = x1; px <= x2; px++) {
      ctx.fillRect(px, y1, 1, 1)
      ctx.fillRect(px, y2, 1, 1)
    }
    // Left and right edges
    for (let py = y1; py <= y2; py++) {
      ctx.fillRect(x1, py, 1, 1)
      ctx.fillRect(x2, py, 1, 1)
    }
  }
}

export function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, fill: boolean, color: string) {
  ctx.fillStyle = color
  const points = fill ? getFilledCirclePoints(cx, cy, r) : getCirclePoints(cx, cy, r)
  for (const p of points) {
    ctx.fillRect(p.x, p.y, 1, 1)
  }
}

export function drawEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, fill: boolean, color: string) {
  ctx.fillStyle = color

  if (fill) {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx || 1) + (y * y) / (ry * ry || 1) <= 1) {
          ctx.fillRect(cx + x, cy + y, 1, 1)
        }
      }
    }
  } else {
    const points = getEllipsePoints(cx, cy, rx, ry)
    for (const p of points) {
      ctx.fillRect(p.x, p.y, 1, 1)
    }
  }
}

export function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: boolean, color: string) {
  ctx.fillStyle = color

  const x1 = Math.min(x, x + w)
  const y1 = Math.min(y, y + h)
  const x2 = Math.max(x, x + w)
  const y2 = Math.max(y, y + h)
  const width = x2 - x1
  const height = y2 - y1

  r = Math.min(r, Math.floor(width / 2), Math.floor(height / 2))

  if (fill) {
    // Fill center rectangle
    for (let py = y1 + r; py <= y2 - r; py++) {
      for (let px = x1; px <= x2; px++) {
        ctx.fillRect(px, py, 1, 1)
      }
    }
    // Fill top and bottom rectangles
    for (let py = y1; py < y1 + r; py++) {
      for (let px = x1 + r; px <= x2 - r; px++) {
        ctx.fillRect(px, py, 1, 1)
      }
    }
    for (let py = y2 - r + 1; py <= y2; py++) {
      for (let px = x1 + r; px <= x2 - r; px++) {
        ctx.fillRect(px, py, 1, 1)
      }
    }
    // Fill corners
    for (let dy = 0; dy < r; dy++) {
      for (let dx = 0; dx < r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          // Top-left
          ctx.fillRect(x1 + r - dx - 1, y1 + r - dy - 1, 1, 1)
          // Top-right
          ctx.fillRect(x2 - r + dx, y1 + r - dy - 1, 1, 1)
          // Bottom-left
          ctx.fillRect(x1 + r - dx - 1, y2 - r + dy, 1, 1)
          // Bottom-right
          ctx.fillRect(x2 - r + dx, y2 - r + dy, 1, 1)
        }
      }
    }
  } else {
    // Draw horizontal lines
    for (let px = x1 + r; px <= x2 - r; px++) {
      ctx.fillRect(px, y1, 1, 1)
      ctx.fillRect(px, y2, 1, 1)
    }
    // Draw vertical lines
    for (let py = y1 + r; py <= y2 - r; py++) {
      ctx.fillRect(x1, py, 1, 1)
      ctx.fillRect(x2, py, 1, 1)
    }
    // Draw corners
    const cornerPoints = getCirclePoints(0, 0, r)
    for (const p of cornerPoints) {
      if (p.x >= 0 && p.y >= 0) {
        ctx.fillRect(x2 - r + p.x, y2 - r + p.y, 1, 1)
      }
      if (p.x <= 0 && p.y >= 0) {
        ctx.fillRect(x1 + r + p.x, y2 - r + p.y, 1, 1)
      }
      if (p.x >= 0 && p.y <= 0) {
        ctx.fillRect(x2 - r + p.x, y1 + r + p.y, 1, 1)
      }
      if (p.x <= 0 && p.y <= 0) {
        ctx.fillRect(x1 + r + p.x, y1 + r + p.y, 1, 1)
      }
    }
  }
}

// Simple bitmap font data (6x8)
const FONT_6X8: Record<string, number[]> = {
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  '!': [0x00, 0x00, 0x5F, 0x00, 0x00, 0x00],
  '"': [0x00, 0x07, 0x00, 0x07, 0x00, 0x00],
  '#': [0x14, 0x7F, 0x14, 0x7F, 0x14, 0x00],
  '$': [0x24, 0x2A, 0x7F, 0x2A, 0x12, 0x00],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62, 0x00],
  '&': [0x36, 0x49, 0x55, 0x22, 0x50, 0x00],
  '\'': [0x00, 0x05, 0x03, 0x00, 0x00, 0x00],
  '(': [0x00, 0x1C, 0x22, 0x41, 0x00, 0x00],
  ')': [0x00, 0x41, 0x22, 0x1C, 0x00, 0x00],
  '*': [0x08, 0x2A, 0x1C, 0x2A, 0x08, 0x00],
  '+': [0x08, 0x08, 0x3E, 0x08, 0x08, 0x00],
  ',': [0x00, 0x50, 0x30, 0x00, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08, 0x00],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00, 0x00],
  '/': [0x20, 0x10, 0x08, 0x04, 0x02, 0x00],
  '0': [0x3E, 0x51, 0x49, 0x45, 0x3E, 0x00],
  '1': [0x00, 0x42, 0x7F, 0x40, 0x00, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46, 0x00],
  '3': [0x21, 0x41, 0x45, 0x4B, 0x31, 0x00],
  '4': [0x18, 0x14, 0x12, 0x7F, 0x10, 0x00],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39, 0x00],
  '6': [0x3C, 0x4A, 0x49, 0x49, 0x30, 0x00],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03, 0x00],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36, 0x00],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1E, 0x00],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00, 0x00],
  ';': [0x00, 0x56, 0x36, 0x00, 0x00, 0x00],
  '<': [0x00, 0x08, 0x14, 0x22, 0x41, 0x00],
  '=': [0x14, 0x14, 0x14, 0x14, 0x14, 0x00],
  '>': [0x41, 0x22, 0x14, 0x08, 0x00, 0x00],
  '?': [0x02, 0x01, 0x51, 0x09, 0x06, 0x00],
  '@': [0x32, 0x49, 0x79, 0x41, 0x3E, 0x00],
  'A': [0x7E, 0x11, 0x11, 0x11, 0x7E, 0x00],
  'B': [0x7F, 0x49, 0x49, 0x49, 0x36, 0x00],
  'C': [0x3E, 0x41, 0x41, 0x41, 0x22, 0x00],
  'D': [0x7F, 0x41, 0x41, 0x22, 0x1C, 0x00],
  'E': [0x7F, 0x49, 0x49, 0x49, 0x41, 0x00],
  'F': [0x7F, 0x09, 0x09, 0x01, 0x01, 0x00],
  'G': [0x3E, 0x41, 0x41, 0x51, 0x32, 0x00],
  'H': [0x7F, 0x08, 0x08, 0x08, 0x7F, 0x00],
  'I': [0x00, 0x41, 0x7F, 0x41, 0x00, 0x00],
  'J': [0x20, 0x40, 0x41, 0x3F, 0x01, 0x00],
  'K': [0x7F, 0x08, 0x14, 0x22, 0x41, 0x00],
  'L': [0x7F, 0x40, 0x40, 0x40, 0x40, 0x00],
  'M': [0x7F, 0x02, 0x04, 0x02, 0x7F, 0x00],
  'N': [0x7F, 0x04, 0x08, 0x10, 0x7F, 0x00],
  'O': [0x3E, 0x41, 0x41, 0x41, 0x3E, 0x00],
  'P': [0x7F, 0x09, 0x09, 0x09, 0x06, 0x00],
  'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E, 0x00],
  'R': [0x7F, 0x09, 0x19, 0x29, 0x46, 0x00],
  'S': [0x46, 0x49, 0x49, 0x49, 0x31, 0x00],
  'T': [0x01, 0x01, 0x7F, 0x01, 0x01, 0x00],
  'U': [0x3F, 0x40, 0x40, 0x40, 0x3F, 0x00],
  'V': [0x1F, 0x20, 0x40, 0x20, 0x1F, 0x00],
  'W': [0x7F, 0x20, 0x18, 0x20, 0x7F, 0x00],
  'X': [0x63, 0x14, 0x08, 0x14, 0x63, 0x00],
  'Y': [0x03, 0x04, 0x78, 0x04, 0x03, 0x00],
  'Z': [0x61, 0x51, 0x49, 0x45, 0x43, 0x00],
  '[': [0x00, 0x00, 0x7F, 0x41, 0x41, 0x00],
  '\\': [0x02, 0x04, 0x08, 0x10, 0x20, 0x00],
  ']': [0x41, 0x41, 0x7F, 0x00, 0x00, 0x00],
  '^': [0x04, 0x02, 0x01, 0x02, 0x04, 0x00],
  '_': [0x40, 0x40, 0x40, 0x40, 0x40, 0x00],
  '`': [0x00, 0x01, 0x02, 0x04, 0x00, 0x00],
  'a': [0x20, 0x54, 0x54, 0x54, 0x78, 0x00],
  'b': [0x7F, 0x48, 0x44, 0x44, 0x38, 0x00],
  'c': [0x38, 0x44, 0x44, 0x44, 0x20, 0x00],
  'd': [0x38, 0x44, 0x44, 0x48, 0x7F, 0x00],
  'e': [0x38, 0x54, 0x54, 0x54, 0x18, 0x00],
  'f': [0x08, 0x7E, 0x09, 0x01, 0x02, 0x00],
  'g': [0x08, 0x14, 0x54, 0x54, 0x3C, 0x00],
  'h': [0x7F, 0x08, 0x04, 0x04, 0x78, 0x00],
  'i': [0x00, 0x44, 0x7D, 0x40, 0x00, 0x00],
  'j': [0x20, 0x40, 0x44, 0x3D, 0x00, 0x00],
  'k': [0x00, 0x7F, 0x10, 0x28, 0x44, 0x00],
  'l': [0x00, 0x41, 0x7F, 0x40, 0x00, 0x00],
  'm': [0x7C, 0x04, 0x18, 0x04, 0x78, 0x00],
  'n': [0x7C, 0x08, 0x04, 0x04, 0x78, 0x00],
  'o': [0x38, 0x44, 0x44, 0x44, 0x38, 0x00],
  'p': [0x7C, 0x14, 0x14, 0x14, 0x08, 0x00],
  'q': [0x08, 0x14, 0x14, 0x18, 0x7C, 0x00],
  'r': [0x7C, 0x08, 0x04, 0x04, 0x08, 0x00],
  's': [0x48, 0x54, 0x54, 0x54, 0x20, 0x00],
  't': [0x04, 0x3F, 0x44, 0x40, 0x20, 0x00],
  'u': [0x3C, 0x40, 0x40, 0x20, 0x7C, 0x00],
  'v': [0x1C, 0x20, 0x40, 0x20, 0x1C, 0x00],
  'w': [0x3C, 0x40, 0x30, 0x40, 0x3C, 0x00],
  'x': [0x44, 0x28, 0x10, 0x28, 0x44, 0x00],
  'y': [0x0C, 0x50, 0x50, 0x50, 0x3C, 0x00],
  'z': [0x44, 0x64, 0x54, 0x4C, 0x44, 0x00],
  '{': [0x00, 0x08, 0x36, 0x41, 0x00, 0x00],
  '|': [0x00, 0x00, 0x7F, 0x00, 0x00, 0x00],
  '}': [0x00, 0x41, 0x36, 0x08, 0x00, 0x00],
  '~': [0x08, 0x08, 0x2A, 0x1C, 0x08, 0x00]
}

export function drawText(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, fontSize: number, color: string) {
  ctx.fillStyle = color
  const scale = Math.floor(fontSize / 8) || 1
  let cursorX = x

  for (const char of text) {
    const charData = FONT_6X8[char] || FONT_6X8['?'] || FONT_6X8[' ']
    if (charData) {
      for (let col = 0; col < 6; col++) {
        const colData = charData[col]
        for (let row = 0; row < 8; row++) {
          if ((colData >> row) & 1) {
            for (let sy = 0; sy < scale; sy++) {
              for (let sx = 0; sx < scale; sx++) {
                ctx.fillRect(cursorX + col * scale + sx, y + row * scale + sy, 1, 1)
              }
            }
          }
        }
      }
    }
    cursorX += 6 * scale
  }
}

// Main element drawing function
export function drawElement(ctx: CanvasRenderingContext2D, element: Element) {
  const color = element.properties.color === 1 ? '#00ff00' : '#1a1a1a'

  switch (element.type) {
    case 'pixel':
      drawPixel(ctx, element.x, element.y, color)
      break

    case 'line':
      drawLine(
        ctx,
        element.x,
        element.y,
        element.x + (element.properties.x2 || 0),
        element.y + (element.properties.y2 || 0),
        color
      )
      break

    case 'rect':
      drawRect(ctx, element.x, element.y, element.width, element.height, element.properties.fill || false, color)
      break

    case 'circle': {
      const r = Math.floor(element.width / 2)
      drawCircle(ctx, element.x + r, element.y + r, r, element.properties.fill || false, color)
      break
    }

    case 'ellipse': {
      const rx = Math.floor(element.width / 2)
      const ry = Math.floor(element.height / 2)
      drawEllipse(ctx, element.x + rx, element.y + ry, rx, ry, element.properties.fill || false, color)
      break
    }

    case 'roundRect':
      drawRoundRect(
        ctx,
        element.x,
        element.y,
        element.width,
        element.height,
        element.properties.radius || 4,
        element.properties.fill || false,
        color
      )
      break

    case 'text':
      if (element.properties.text) {
        drawText(ctx, element.x, element.y, element.properties.text, element.properties.fontSize || 8, color)
      }
      break

    case 'image':
      drawImageElement(ctx, element)
      break
  }
}

// Image processing and drawing
export function drawImageElement(ctx: CanvasRenderingContext2D, element: Element) {
  if (!element.properties.imageData) return

  const img = new Image()
  img.onload = () => {
    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = element.width
    tempCanvas.height = element.height
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Draw and scale image
    tempCtx.drawImage(img, 0, 0, element.width, element.height)
    const imageData = tempCtx.getImageData(0, 0, element.width, element.height)
    const threshold = element.properties.threshold || 128

    // Convert to binary and draw
    for (let y = 0; y < element.height; y++) {
      for (let x = 0; x < element.width; x++) {
        const i = (y * element.width + x) * 4
        const gray = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
        if (gray < threshold) {
          ctx.fillStyle = '#00ff00'
          ctx.fillRect(element.x + x, element.y + y, 1, 1)
        }
      }
    }
  }
  img.src = element.properties.imageData
}
