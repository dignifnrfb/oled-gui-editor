// Smart alignment guides composable
import { ref } from 'vue'
import type { Element } from '@/types'

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical'
  position: number
  start: number
  end: number
}

export interface SnapResult {
  x: number
  y: number
  guides: AlignmentGuide[]
}

const SNAP_THRESHOLD = 5 // pixels

export function useAlignmentGuides(
  elements: () => Element[],
  selectedIds: () => string[],
  canvasWidth: () => number,
  canvasHeight: () => number
) {
  const activeGuides = ref<AlignmentGuide[]>([])
  const snapEnabled = ref(true)

  // Get all snap points from non-selected elements
  function getSnapPoints(): { horizontal: number[]; vertical: number[] } {
    const horizontal: Set<number> = new Set()
    const vertical: Set<number> = new Set()

    // Add canvas edges and center
    horizontal.add(0)
    horizontal.add(canvasHeight() / 2)
    horizontal.add(canvasHeight())
    vertical.add(0)
    vertical.add(canvasWidth() / 2)
    vertical.add(canvasWidth())

    // Add element edges and centers
    for (const el of elements()) {
      if (selectedIds().includes(el.id)) continue

      // Horizontal guides (y positions)
      horizontal.add(el.y)                          // Top
      horizontal.add(el.y + el.height / 2)          // Center
      horizontal.add(el.y + el.height)              // Bottom

      // Vertical guides (x positions)
      vertical.add(el.x)                            // Left
      vertical.add(el.x + el.width / 2)             // Center
      vertical.add(el.x + el.width)                 // Right
    }

    return {
      horizontal: Array.from(horizontal).sort((a, b) => a - b),
      vertical: Array.from(vertical).sort((a, b) => a - b)
    }
  }

  // Calculate snap position for a moving element
  function calculateSnap(
    x: number,
    y: number,
    width: number,
    height: number
  ): SnapResult {
    if (!snapEnabled.value) {
      return { x, y, guides: [] }
    }

    const snapPoints = getSnapPoints()
    const guides: AlignmentGuide[] = []
    let snappedX = x
    let snappedY = y

    // Element edges and center
    const elementLeft = x
    const elementCenterX = x + width / 2
    const elementRight = x + width
    const elementTop = y
    const elementCenterY = y + height / 2
    const elementBottom = y + height

    // Check vertical snap (x positions)
    let minDistX = SNAP_THRESHOLD + 1
    for (const snapX of snapPoints.vertical) {
      // Check left edge
      const distLeft = Math.abs(elementLeft - snapX)
      if (distLeft < minDistX) {
        minDistX = distLeft
        snappedX = snapX
      }
      // Check center
      const distCenter = Math.abs(elementCenterX - snapX)
      if (distCenter < minDistX) {
        minDistX = distCenter
        snappedX = snapX - width / 2
      }
      // Check right edge
      const distRight = Math.abs(elementRight - snapX)
      if (distRight < minDistX) {
        minDistX = distRight
        snappedX = snapX - width
      }
    }

    // Check horizontal snap (y positions)
    let minDistY = SNAP_THRESHOLD + 1
    for (const snapY of snapPoints.horizontal) {
      // Check top edge
      const distTop = Math.abs(elementTop - snapY)
      if (distTop < minDistY) {
        minDistY = distTop
        snappedY = snapY
      }
      // Check center
      const distCenter = Math.abs(elementCenterY - snapY)
      if (distCenter < minDistY) {
        minDistY = distCenter
        snappedY = snapY - height / 2
      }
      // Check bottom edge
      const distBottom = Math.abs(elementBottom - snapY)
      if (distBottom < minDistY) {
        minDistY = distBottom
        snappedY = snapY - height
      }
    }

    // Generate visible guides
    if (minDistX <= SNAP_THRESHOLD) {
      const guideX = snappedX === x ? elementLeft :
                     snappedX === x - width / 2 + width / 2 ? elementCenterX :
                     snappedX + width

      // Find matching elements for this guide
      let minY = snappedY
      let maxY = snappedY + height
      for (const el of elements()) {
        if (selectedIds().includes(el.id)) continue
        if (Math.abs(el.x - guideX) < 1 ||
            Math.abs(el.x + el.width / 2 - guideX) < 1 ||
            Math.abs(el.x + el.width - guideX) < 1) {
          minY = Math.min(minY, el.y)
          maxY = Math.max(maxY, el.y + el.height)
        }
      }

      guides.push({
        type: 'vertical',
        position: Math.round(guideX),
        start: Math.round(minY),
        end: Math.round(maxY)
      })
    }

    if (minDistY <= SNAP_THRESHOLD) {
      const guideY = snappedY === y ? elementTop :
                     snappedY === y - height / 2 + height / 2 ? elementCenterY :
                     snappedY + height

      // Find matching elements for this guide
      let minX = snappedX
      let maxX = snappedX + width
      for (const el of elements()) {
        if (selectedIds().includes(el.id)) continue
        if (Math.abs(el.y - guideY) < 1 ||
            Math.abs(el.y + el.height / 2 - guideY) < 1 ||
            Math.abs(el.y + el.height - guideY) < 1) {
          minX = Math.min(minX, el.x)
          maxX = Math.max(maxX, el.x + el.width)
        }
      }

      guides.push({
        type: 'horizontal',
        position: Math.round(guideY),
        start: Math.round(minX),
        end: Math.round(maxX)
      })
    }

    activeGuides.value = guides

    return {
      x: Math.round(snappedX),
      y: Math.round(snappedY),
      guides
    }
  }

  // Clear guides when drag ends
  function clearGuides() {
    activeGuides.value = []
  }

  // Render guides to canvas
  function renderGuides(ctx: CanvasRenderingContext2D, scale: number) {
    if (activeGuides.value.length === 0) return

    ctx.save()
    ctx.strokeStyle = '#ff6b6b'
    ctx.lineWidth = 1 / scale
    ctx.setLineDash([4 / scale, 4 / scale])

    for (const guide of activeGuides.value) {
      ctx.beginPath()
      if (guide.type === 'vertical') {
        ctx.moveTo(guide.position, guide.start)
        ctx.lineTo(guide.position, guide.end)
      } else {
        ctx.moveTo(guide.start, guide.position)
        ctx.lineTo(guide.end, guide.position)
      }
      ctx.stroke()
    }

    ctx.restore()
  }

  // Toggle snap
  function toggleSnap() {
    snapEnabled.value = !snapEnabled.value
  }

  return {
    activeGuides,
    snapEnabled,
    calculateSnap,
    clearGuides,
    renderGuides,
    toggleSnap
  }
}
