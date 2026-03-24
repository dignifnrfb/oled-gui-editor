import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCanvasStore = defineStore('canvas', () => {
  const scale = ref(4)
  const offsetX = ref(0)
  const offsetY = ref(0)
  const showGrid = ref(true)
  const selectedElementIds = ref<string[]>([])
  const isDrawing = ref(false)
  const drawStartPoint = ref<{ x: number; y: number } | null>(null)
  const drawCurrentPoint = ref<{ x: number; y: number } | null>(null)
  const clipboard = ref<any[]>([])

  const minScale = 1
  const maxScale = 16

  function setScale(newScale: number) {
    scale.value = Math.max(minScale, Math.min(maxScale, newScale))
  }

  function zoomIn() {
    setScale(scale.value * 1.25)
  }

  function zoomOut() {
    setScale(scale.value / 1.25)
  }

  function resetView() {
    scale.value = 4
    offsetX.value = 0
    offsetY.value = 0
  }

  function toggleGrid() {
    showGrid.value = !showGrid.value
  }

  function selectElement(elementId: string, addToSelection = false) {
    if (addToSelection) {
      if (selectedElementIds.value.includes(elementId)) {
        selectedElementIds.value = selectedElementIds.value.filter(id => id !== elementId)
      } else {
        selectedElementIds.value.push(elementId)
      }
    } else {
      selectedElementIds.value = [elementId]
    }
  }

  function selectElements(elementIds: string[]) {
    selectedElementIds.value = [...elementIds]
  }

  function clearSelection() {
    selectedElementIds.value = []
  }

  function isSelected(elementId: string) {
    return selectedElementIds.value.includes(elementId)
  }

  function startDrawing(x: number, y: number) {
    isDrawing.value = true
    drawStartPoint.value = { x, y }
    drawCurrentPoint.value = { x, y }
  }

  function updateDrawing(x: number, y: number) {
    drawCurrentPoint.value = { x, y }
  }

  function endDrawing() {
    isDrawing.value = false
    drawStartPoint.value = null
    drawCurrentPoint.value = null
  }

  function setClipboard(elements: any[]) {
    clipboard.value = JSON.parse(JSON.stringify(elements))
  }

  function pan(dx: number, dy: number) {
    offsetX.value += dx
    offsetY.value += dy
  }

  return {
    scale,
    offsetX,
    offsetY,
    showGrid,
    selectedElementIds,
    isDrawing,
    drawStartPoint,
    drawCurrentPoint,
    clipboard,
    setScale,
    zoomIn,
    zoomOut,
    resetView,
    toggleGrid,
    selectElement,
    selectElements,
    clearSelection,
    isSelected,
    startDrawing,
    updateDrawing,
    endDrawing,
    setClipboard,
    pan
  }
})
