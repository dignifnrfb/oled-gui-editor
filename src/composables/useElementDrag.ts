// Element drag and resize composable
import { ref } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'
import type { Element } from '@/types'

export interface DragState {
  isDragging: boolean
  elements: { id: string; startX: number; startY: number }[]
  startPoint: { x: number; y: number } | null
}

export interface ResizeState {
  isResizing: boolean
  element: Element | null
  handle: 'nw' | 'ne' | 'sw' | 'se' | null
  start: { x: number; y: number; width: number; height: number } | null
  startPoint: { x: number; y: number } | null
}

export function useElementDrag(onRender: () => void) {
  const projectStore = useProjectStore()
  const canvasStore = useCanvasStore()

  const dragState = ref<DragState>({
    isDragging: false,
    elements: [],
    startPoint: null
  })

  const resizeState = ref<ResizeState>({
    isResizing: false,
    element: null,
    handle: null,
    start: null,
    startPoint: null
  })

  // Start dragging selected elements
  function startDrag(coords: { x: number; y: number }) {
    const selectedIds = canvasStore.selectedElementIds
    if (selectedIds.length === 0) return

    dragState.value = {
      isDragging: true,
      elements: selectedIds.map(id => {
        const el = projectStore.currentPage.elements.find(e => e.id === id)!
        return { id, startX: el.x, startY: el.y }
      }),
      startPoint: coords
    }
    resizeState.value.isResizing = false
  }

  // Update drag position
  function updateDrag(coords: { x: number; y: number }, snapFn?: (x: number, y: number, w: number, h: number) => { x: number; y: number }) {
    if (!dragState.value.isDragging || !dragState.value.startPoint) return

    const dx = coords.x - dragState.value.startPoint.x
    const dy = coords.y - dragState.value.startPoint.y

    for (const item of dragState.value.elements) {
      const el = projectStore.currentPage.elements.find(e => e.id === item.id)
      if (el && !el.locked) {
        let newX = item.startX + dx
        let newY = item.startY + dy

        // Apply snap if provided
        if (snapFn) {
          const snapped = snapFn(newX, newY, el.width, el.height)
          newX = snapped.x
          newY = snapped.y
        }

        el.x = newX
        el.y = newY
      }
    }
    projectStore.isDirty = true
    onRender()
  }

  // End drag
  function endDrag() {
    if (dragState.value.isDragging) {
      projectStore.saveToHistory()
    }
    dragState.value = {
      isDragging: false,
      elements: [],
      startPoint: null
    }
  }

  // Start resizing an element
  function startResize(element: Element, handle: 'nw' | 'ne' | 'sw' | 'se', coords: { x: number; y: number }) {
    if (!isResizable(element)) return

    resizeState.value = {
      isResizing: true,
      element,
      handle,
      start: {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height
      },
      startPoint: coords
    }
    dragState.value.isDragging = false
  }

  // Update resize
  function updateResize(coords: { x: number; y: number }) {
    const { isResizing, element, handle, start, startPoint } = resizeState.value
    if (!isResizing || !element || !start || !startPoint) return

    const dx = coords.x - startPoint.x
    const dy = coords.y - startPoint.y

    let newX = start.x
    let newY = start.y
    let newW = start.width
    let newH = start.height

    switch (handle) {
      case 'nw':
        newX = start.x + dx
        newY = start.y + dy
        newW = start.width - dx
        newH = start.height - dy
        break
      case 'ne':
        newY = start.y + dy
        newW = start.width + dx
        newH = start.height - dy
        break
      case 'sw':
        newX = start.x + dx
        newW = start.width - dx
        newH = start.height + dy
        break
      case 'se':
        newW = start.width + dx
        newH = start.height + dy
        break
    }

    // Ensure minimum size
    newW = Math.max(1, Math.round(newW))
    newH = Math.max(1, Math.round(newH))
    newX = Math.round(newX)
    newY = Math.round(newY)

    // Circle: maintain square aspect ratio
    if (element.type === 'circle') {
      const size = Math.max(newW, newH)
      switch (handle) {
        case 'nw': {
          const anchorX = start.x + start.width
          const anchorY = start.y + start.height
          newW = size
          newH = size
          newX = anchorX - size
          newY = anchorY - size
          break
        }
        case 'ne': {
          const anchorY = start.y + start.height
          newW = size
          newH = size
          newX = start.x
          newY = anchorY - size
          break
        }
        case 'sw': {
          const anchorX = start.x + start.width
          newW = size
          newH = size
          newX = anchorX - size
          newY = start.y
          break
        }
        case 'se':
          newW = size
          newH = size
          newX = start.x
          newY = start.y
          break
      }
    }

    element.x = newX
    element.y = newY
    element.width = newW
    element.height = newH
    projectStore.isDirty = true
    onRender()
  }

  // End resize
  function endResize() {
    if (resizeState.value.isResizing) {
      projectStore.saveToHistory()
    }
    resizeState.value = {
      isResizing: false,
      element: null,
      handle: null,
      start: null,
      startPoint: null
    }
  }

  // Check if element is resizable
  function isResizable(element: Element): boolean {
    return element.type !== 'pixel'
  }

  // Find element at position
  function findElementAt(x: number, y: number): Element | null {
    const sortedElements = [...projectStore.currentPage.elements].sort((a, b) => b.zIndex - a.zIndex)

    for (const element of sortedElements) {
      if (!element.visible || element.locked) continue

      // Text elements: estimate bounding box from content
      const fallbackWidth = element.type === 'text'
        ? Math.max(element.width || 0, (element.properties.text?.length || 1) * (element.properties.fontSize || 8))
        : element.width
      const fallbackHeight = element.type === 'text'
        ? Math.max(element.height || 0, (element.properties.fontSize || 8) * 2)
        : element.height

      const right = element.x + fallbackWidth - 1
      const bottom = element.y + fallbackHeight - 1

      if (x >= element.x && x <= right && y >= element.y && y <= bottom) {
        return element
      }
    }
    return null
  }

  return {
    dragState,
    resizeState,
    startDrag,
    updateDrag,
    endDrag,
    startResize,
    updateResize,
    endResize,
    isResizable,
    findElementAt
  }
}
