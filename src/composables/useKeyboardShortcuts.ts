// Keyboard shortcuts composable
import { onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'
import { useToolStore } from '@/stores/tools'

export interface KeyboardShortcutsOptions {
  onCopy?: () => void
  onPaste?: () => void
  onDelete?: () => void
  onSelectAll?: () => void
  onRender?: () => void
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const projectStore = useProjectStore()
  const canvasStore = useCanvasStore()
  const toolStore = useToolStore()

  function handleKeyDown(e: KeyboardEvent) {
    const isCtrl = e.ctrlKey || e.metaKey
    const isShift = e.shiftKey
    const target = e.target as HTMLElement

    // Ignore if typing in input/textarea
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // Ctrl+Z - Undo
    if (isCtrl && !isShift && e.key === 'z') {
      e.preventDefault()
      projectStore.undo()
      options.onRender?.()
      return
    }

    // Ctrl+Shift+Z or Ctrl+Y - Redo
    if ((isCtrl && isShift && e.key === 'z') || (isCtrl && e.key === 'y')) {
      e.preventDefault()
      projectStore.redo()
      options.onRender?.()
      return
    }

    // Ctrl+S - Save
    if (isCtrl && e.key === 's') {
      e.preventDefault()
      saveProject()
      return
    }

    // Ctrl+O - Open
    if (isCtrl && e.key === 'o') {
      e.preventDefault()
      openProject()
      return
    }

    // Ctrl+N - New
    if (isCtrl && e.key === 'n') {
      e.preventDefault()
      newProject()
      return
    }

    // Ctrl+C - Copy
    if (isCtrl && e.key === 'c') {
      e.preventDefault()
      options.onCopy?.()
      return
    }

    // Ctrl+V - Paste
    if (isCtrl && e.key === 'v') {
      e.preventDefault()
      options.onPaste?.()
      return
    }

    // Ctrl+A - Select All
    if (isCtrl && e.key === 'a') {
      e.preventDefault()
      options.onSelectAll?.()
      return
    }

    // Delete/Backspace - Delete selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      options.onDelete?.()
      return
    }

    // Escape - Clear selection / Cancel
    if (e.key === 'Escape') {
      e.preventDefault()
      canvasStore.clearSelection()
      toolStore.setTool('select')
      return
    }

    // Tool shortcuts (single keys)
    if (!isCtrl && !isShift) {
      switch (e.key.toLowerCase()) {
        case 'v':
          toolStore.setTool('select')
          break
        case 'p':
          toolStore.setTool('pixel')
          break
        case 'l':
          toolStore.setTool('line')
          break
        case 'r':
          toolStore.setTool('rect')
          break
        case 'c':
          toolStore.setTool('circle')
          break
        case 'e':
          toolStore.setTool('ellipse')
          break
        case 't':
          toolStore.setTool('text')
          break
        case 'i':
          toolStore.setTool('image')
          break
        case 'x':
          toolStore.setTool('eraser')
          break
        case 'g':
          canvasStore.toggleGrid()
          options.onRender?.()
          break
        case 'f':
          toolStore.toggleFill()
          break
        case ' ':
          toolStore.toggleColor()
          break
      }
    }

    // Arrow keys - Move selected elements
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (canvasStore.selectedElementIds.length > 0) {
        e.preventDefault()
        const step = isShift ? 10 : 1
        let dx = 0, dy = 0

        switch (e.key) {
          case 'ArrowUp': dy = -step; break
          case 'ArrowDown': dy = step; break
          case 'ArrowLeft': dx = -step; break
          case 'ArrowRight': dx = step; break
        }

        for (const id of canvasStore.selectedElementIds) {
          projectStore.moveElement(id, dx, dy)
        }
        projectStore.saveToHistory()
        options.onRender?.()
      }
    }
  }

  async function saveProject() {
    const data = JSON.stringify(projectStore.getProjectData(), null, 2)
    const result = await window.electronAPI.saveProject(data, projectStore.filePath)
    if (result.success && result.filePath) {
      projectStore.setFilePath(result.filePath)
    }
  }

  async function openProject() {
    const result = await window.electronAPI.openProject()
    if (result.success && result.data) {
      try {
        const project = JSON.parse(result.data)
        project.filePath = result.filePath
        projectStore.loadProject(project)
        options.onRender?.()
      } catch (err) {
        console.error('Failed to parse project file:', err)
      }
    }
  }

  function newProject() {
    if (projectStore.isDirty) {
      // Could show confirmation dialog here
    }
    projectStore.newProject()
    options.onRender?.()
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    saveProject,
    openProject,
    newProject
  }
}
