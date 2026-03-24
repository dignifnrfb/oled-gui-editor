import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, ProjectConfig, Page, Element, HistoryState } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const defaultConfig: ProjectConfig = {
  name: '新建项目',
  author: '',
  version: '1.0.0',
  oled: {
    width: 128,
    height: 64,
    driver: 'SSD1306',
    bus: 'I2C',
    i2cAddress: 0x3c,
    rotation: 0
  },
  mcu: {
    platform: 'STM32F1',
    codeStyle: 'HAL',
    pins: {
      sda: 'PB7',
      scl: 'PB6'
    }
  },
  codeGen: {
    includeComments: true,
    useConst: true,
    arrayFormat: 'COLUMN',
    bitOrder: 'LSB',
    compression: 'NONE'
  },
  runtime: {
    frameRate: 30
  }
}

function createDefaultPage(): Page {
  return {
    id: uuidv4(),
    name: '页面1',
    elements: [],
    links: [],
    backgroundColor: 0
  }
}

export const useProjectStore = defineStore('project', () => {
  const config = ref<ProjectConfig>({ ...defaultConfig })
  const pages = ref<Page[]>([createDefaultPage()])
  const currentPageId = ref<string>(pages.value[0].id)
  const filePath = ref<string | undefined>(undefined)
  const isDirty = ref(false)

  // History for undo/redo
  const history = ref<HistoryState[]>([])
  const historyIndex = ref(-1)
  const maxHistory = 50

  const currentPage = computed(() =>
    pages.value.find(p => p.id === currentPageId.value) || pages.value[0]
  )

  const currentPageIndex = computed(() =>
    pages.value.findIndex(p => p.id === currentPageId.value)
  )

  function saveToHistory() {
    const state: HistoryState = {
      pages: JSON.parse(JSON.stringify(pages.value)),
      currentPageId: currentPageId.value
    }

    // Remove any future states if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(state)
    if (history.value.length > maxHistory) {
      history.value.shift()
    }
    historyIndex.value = history.value.length - 1
    isDirty.value = true
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const state = history.value[historyIndex.value]
      pages.value = JSON.parse(JSON.stringify(state.pages))
      currentPageId.value = state.currentPageId
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const state = history.value[historyIndex.value]
      pages.value = JSON.parse(JSON.stringify(state.pages))
      currentPageId.value = state.currentPageId
    }
  }

  function canUndo() {
    return historyIndex.value > 0
  }

  function canRedo() {
    return historyIndex.value < history.value.length - 1
  }

  function addPage(name?: string) {
    const newPage: Page = {
      id: uuidv4(),
      name: name || `页面${pages.value.length + 1}`,
      elements: [],
      links: [],
      backgroundColor: 0
    }
    pages.value.push(newPage)
    currentPageId.value = newPage.id
    saveToHistory()
  }

  function deletePage(pageId: string) {
    if (pages.value.length <= 1) return
    const index = pages.value.findIndex(p => p.id === pageId)
    if (index !== -1) {
      pages.value.splice(index, 1)
      if (currentPageId.value === pageId) {
        currentPageId.value = pages.value[Math.max(0, index - 1)].id
      }
      saveToHistory()
    }
  }

  function duplicatePage(pageId: string) {
    const page = pages.value.find(p => p.id === pageId)
    if (page) {
      const newPage: Page = {
        ...JSON.parse(JSON.stringify(page)),
        id: uuidv4(),
        name: `${page.name} (副本)`
      }
      // Regenerate element IDs
      newPage.elements = newPage.elements.map(el => ({
        ...el,
        id: uuidv4()
      }))
      pages.value.push(newPage)
      currentPageId.value = newPage.id
      saveToHistory()
    }
  }

  function setCurrentPage(pageId: string) {
    if (pages.value.some(p => p.id === pageId)) {
      currentPageId.value = pageId
    }
  }

  function addElement(element: Omit<Element, 'id'>) {
    const newElement: Element = {
      ...element,
      id: uuidv4()
    }
    currentPage.value.elements.push(newElement)
    saveToHistory()
    return newElement.id
  }

  function updateElement(elementId: string, updates: Partial<Element>) {
    const element = currentPage.value.elements.find(el => el.id === elementId)
    if (element) {
      Object.assign(element, updates)
      saveToHistory()
    }
  }

  function deleteElement(elementId: string) {
    const index = currentPage.value.elements.findIndex(el => el.id === elementId)
    if (index !== -1) {
      currentPage.value.elements.splice(index, 1)
      saveToHistory()
    }
  }

  function deleteSelectedElements(elementIds: string[]) {
    currentPage.value.elements = currentPage.value.elements.filter(
      el => !elementIds.includes(el.id)
    )
    saveToHistory()
  }

  function moveElement(elementId: string, dx: number, dy: number) {
    const element = currentPage.value.elements.find(el => el.id === elementId)
    if (element) {
      element.x += dx
      element.y += dy
      isDirty.value = true
    }
  }

  function bringToFront(elementId: string) {
    const elements = currentPage.value.elements
    const maxZ = Math.max(...elements.map(el => el.zIndex))
    const element = elements.find(el => el.id === elementId)
    if (element) {
      element.zIndex = maxZ + 1
      saveToHistory()
    }
  }

  function sendToBack(elementId: string) {
    const elements = currentPage.value.elements
    const minZ = Math.min(...elements.map(el => el.zIndex))
    const element = elements.find(el => el.id === elementId)
    if (element) {
      element.zIndex = minZ - 1
      saveToHistory()
    }
  }

  function updateConfig(newConfig: Partial<ProjectConfig>) {
    Object.assign(config.value, newConfig)
    isDirty.value = true
  }

  function newProject() {
    config.value = { ...defaultConfig }
    pages.value = [createDefaultPage()]
    currentPageId.value = pages.value[0].id
    filePath.value = undefined
    isDirty.value = false
    history.value = []
    historyIndex.value = -1
    saveToHistory()
  }

  function loadProject(project: Project) {
    config.value = {
      ...defaultConfig,
      ...project.config,
      runtime: {
        ...defaultConfig.runtime,
        ...(project.config as any).runtime
      }
    }
    pages.value = project.pages
    currentPageId.value = project.currentPageId || project.pages[0]?.id
    filePath.value = project.filePath
    isDirty.value = false
    history.value = []
    historyIndex.value = -1
    saveToHistory()
  }

  function getProjectData(): Project {
    return {
      config: config.value,
      pages: pages.value,
      currentPageId: currentPageId.value,
      filePath: filePath.value,
      isDirty: isDirty.value
    }
  }

  function setFilePath(path: string) {
    filePath.value = path
    isDirty.value = false
  }

  // Initialize history
  saveToHistory()

  return {
    config,
    pages,
    currentPageId,
    filePath,
    isDirty,
    currentPage,
    currentPageIndex,
    undo,
    redo,
    canUndo,
    canRedo,
    addPage,
    deletePage,
    duplicatePage,
    setCurrentPage,
    addElement,
    updateElement,
    deleteElement,
    deleteSelectedElements,
    moveElement,
    bringToFront,
    sendToBack,
    updateConfig,
    newProject,
    loadProject,
    getProjectData,
    setFilePath,
    saveToHistory
  }
})
