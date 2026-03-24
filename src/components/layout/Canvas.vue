<template>
  <div class="canvas-container" ref="containerRef">
    <div
      class="canvas-wrapper"
      :style="wrapperStyle"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @dblclick="handleDoubleClick"
      @contextmenu.prevent="handleContextMenu"
    >
      <!-- OLED Screen Frame -->
      <div class="oled-frame" :style="frameStyle">
        <!-- Pixel Grid -->
        <canvas
          ref="gridCanvasRef"
          class="grid-canvas"
          :width="oledWidth"
          :height="oledHeight"
        ></canvas>

        <!-- Main Drawing Canvas -->
        <canvas
          ref="mainCanvasRef"
          class="main-canvas"
          :width="oledWidth"
          :height="oledHeight"
        ></canvas>

        <!-- Preview Canvas (for drawing operations) -->
        <canvas
          ref="previewCanvasRef"
          class="preview-canvas"
          :width="oledWidth"
          :height="oledHeight"
        ></canvas>

        <!-- Text input overlay -->
        <div
          v-if="textOverlay.visible"
          class="text-edit-overlay"
          :style="getTextOverlayStyle()"
          @mousedown.stop="startOverlayDrag"
        >
          <div class="text-edit-toolbar" @mousedown.stop>
            <el-select v-model="textOverlay.fontSize" size="small" style="width: 90px">
              <el-option :value="6" label="6 px" />
              <el-option :value="8" label="8 px" />
              <el-option :value="12" label="12 px" />
              <el-option :value="16" label="16 px" />
              <el-option :value="24" label="24 px" />
            </el-select>
            <el-radio-group v-model="textOverlay.align" size="small">
              <el-radio-button label="left">左</el-radio-button>
              <el-radio-button label="center">中</el-radio-button>
              <el-radio-button label="right">右</el-radio-button>
            </el-radio-group>
            <el-radio-group v-model="textOverlay.color" size="small">
              <el-radio-button :label="1">白</el-radio-button>
              <el-radio-button :label="0">黑</el-radio-button>
            </el-radio-group>
          </div>
          <textarea
            v-model="textOverlay.value"
            class="text-edit-area"
            :style="{
              fontSize: textOverlay.fontSize * canvasStore.scale + 'px',
              textAlign: textOverlay.align,
              color: textOverlay.color === 1 ? '#00ff00' : '#1a1a1a'
            }"
            @keydown.enter.stop.prevent="confirmTextOverlay"
            @mousedown.stop
          ></textarea>
          <div class="text-edit-actions" @mousedown.stop>
            <el-button size="small" type="primary" @click="confirmTextOverlay">确定</el-button>
            <el-button size="small" text @click="cancelTextOverlay">取消</el-button>
          </div>
          <div
            class="overlay-handle nw"
            @mousedown.stop.prevent="startOverlayResize('nw', $event)"
          ></div>
          <div
            class="overlay-handle ne"
            @mousedown.stop.prevent="startOverlayResize('ne', $event)"
          ></div>
          <div
            class="overlay-handle sw"
            @mousedown.stop.prevent="startOverlayResize('sw', $event)"
          ></div>
          <div
            class="overlay-handle se"
            @mousedown.stop.prevent="startOverlayResize('se', $event)"
          ></div>
        </div>

        <!-- Selection Overlay -->
        <div
          v-for="element in selectedElements"
          :key="element.id"
          class="selection-box"
          :style="getSelectionStyle(element)"
        >
          <template v-if="isResizable(element)">
            <div class="resize-handle nw" @mousedown.stop.prevent="handleResizeMouseDown(element, 'nw', $event)"></div>
            <div class="resize-handle ne" @mousedown.stop.prevent="handleResizeMouseDown(element, 'ne', $event)"></div>
            <div class="resize-handle sw" @mousedown.stop.prevent="handleResizeMouseDown(element, 'sw', $event)"></div>
            <div class="resize-handle se" @mousedown.stop.prevent="handleResizeMouseDown(element, 'se', $event)"></div>
          </template>
        </div>
      </div>
    </div>

    <!-- Coordinates Display -->
    <div class="coords-display" v-if="mouseCoords">
      X: {{ mouseCoords.x }} Y: {{ mouseCoords.y }}
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @mousedown.stop
      @contextmenu.prevent
    >
      <div class="menu-item strong" v-if="selectedElements.length > 0">选中 {{ selectedElements.length }} 个</div>
      <div class="menu-item" @click="copySelected">
        <el-icon><CopyDocument /></el-icon>复制
      </div>
      <div class="menu-item" @click="pasteClipboard">
        <el-icon><DocumentAdd /></el-icon>粘贴
      </div>
      <div class="menu-item danger" @click="deleteSelection" v-if="selectedElements.length > 0">
        <el-icon><Delete /></el-icon>删除
      </div>
      <div class="menu-divider" v-if="selectedElements.length > 0"></div>
      <div class="menu-item" @click="toggleLockSelection" v-if="selectedElements.length > 0">
        <el-icon><Lock /></el-icon>{{ allLocked ? '解锁' : '锁定' }}
      </div>
      <div class="menu-item" @click="toggleVisibilitySelection" v-if="selectedElements.length > 0">
        <el-icon><View /></el-icon>{{ allHidden ? '显示' : '隐藏' }}
      </div>
      <div class="menu-item" @click="bringSelectionToFront" v-if="selectedElements.length > 0">
        <el-icon><Top /></el-icon>置顶
      </div>
      <div class="menu-item" @click="sendSelectionToBack" v-if="selectedElements.length > 0">
        <el-icon><Bottom /></el-icon>置底
      </div>
      <div class="menu-divider" v-if="selectedElements.length > 1"></div>
      <div class="menu-item" @click="alignSelection('left')" v-if="selectedElements.length > 1">
        <el-icon><FullScreen /></el-icon>左对齐
      </div>
      <div class="menu-item" @click="alignSelection('right')" v-if="selectedElements.length > 1">
        <el-icon><FullScreen /></el-icon>右对齐
      </div>
      <div class="menu-item" @click="alignSelection('top')" v-if="selectedElements.length > 1">
        <el-icon><FullScreen /></el-icon>上对齐
      </div>
      <div class="menu-item" @click="alignSelection('bottom')" v-if="selectedElements.length > 1">
        <el-icon><FullScreen /></el-icon>下对齐
      </div>
      <div class="menu-divider" v-if="selectedElements.length === 0"></div>
      <div class="menu-item" @click="selectAll">
        <el-icon><Select /></el-icon>全选当前页
      </div>
      <div class="menu-item" @click="toggleGrid">
        <el-icon><Grid /></el-icon>{{ showGrid ? '隐藏网格' : '显示网格' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'
import { useToolStore } from '@/stores/tools'
import type { Element, ElementType } from '@/types'
import { drawElement, drawPixel, drawLine, drawRect, drawCircle, drawEllipse, drawRoundRect } from '@/utils/drawingUtils'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useAlignmentGuides } from '@/composables/useAlignmentGuides'

const projectStore = useProjectStore()
const canvasStore = useCanvasStore()
const toolStore = useToolStore()

// Alignment guides
const alignmentGuides = useAlignmentGuides(
  () => projectStore.currentPage.elements,
  () => canvasStore.selectedElementIds,
  () => projectStore.config.oled.width,
  () => projectStore.config.oled.height
)

const containerRef = ref<HTMLDivElement>()
const gridCanvasRef = ref<HTMLCanvasElement>()
const mainCanvasRef = ref<HTMLCanvasElement>()
const previewCanvasRef = ref<HTMLCanvasElement>()
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0
})
const textOverlay = ref({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  value: '',
  elementId: null as string | null,
  color: 1 as 0 | 1,
  fontSize: 8 as 6 | 8 | 12 | 16 | 24,
  align: 'left' as 'left' | 'center' | 'right'
})
const textDrawStart = ref<{ x: number; y: number } | null>(null)
const textPreviewRect = ref<{ x: number; y: number; width: number; height: number } | null>(null)
const textOverlayDrag = ref(false)
const textOverlayResizeHandle = ref<'nw' | 'ne' | 'sw' | 'se' | null>(null)
const textOverlayDragStart = ref<{ x: number; y: number; boxX: number; boxY: number; w: number; h: number } | null>(null)

const mouseCoords = ref<{ x: number; y: number } | null>(null)
const isPanning = ref(false)
const lastPanPoint = ref<{ x: number; y: number } | null>(null)
const isDraggingElement = ref(false)
const dragElements = ref<{ id: string; startX: number; startY: number }[]>([])
const dragStartPoint = ref<{ x: number; y: number } | null>(null)
const isResizing = ref(false)
const resizeHandle = ref<'nw' | 'ne' | 'sw' | 'se' | null>(null)
const resizeElement = ref<Element | null>(null)
const resizeStart = ref<{ x: number; y: number; width: number; height: number } | null>(null)

const oledWidth = computed(() => projectStore.config.oled.width)
const oledHeight = computed(() => projectStore.config.oled.height)
const showGrid = computed(() => canvasStore.showGrid)

const wrapperStyle = computed(() => ({
  transform: `translate(${canvasStore.offsetX}px, ${canvasStore.offsetY}px)`
}))

const frameStyle = computed(() => ({
  width: `${oledWidth.value * canvasStore.scale}px`,
  height: `${oledHeight.value * canvasStore.scale}px`
}))

const selectedElements = computed(() =>
  projectStore.currentPage.elements.filter(el =>
    canvasStore.selectedElementIds.includes(el.id)
  )
)

const allLocked = computed(() =>
  selectedElements.value.length > 0 &&
  selectedElements.value.every(el => el.locked)
)

const allHidden = computed(() =>
  selectedElements.value.length > 0 &&
  selectedElements.value.every(el => !el.visible)
)

function getSelectionStyle(element: Element) {
  return {
    left: `${element.x * canvasStore.scale}px`,
    top: `${element.y * canvasStore.scale}px`,
    width: `${element.width * canvasStore.scale}px`,
    height: `${element.height * canvasStore.scale}px`
  }
}

function hideContextMenu() {
  contextMenu.value.visible = false
}

function handleContextMenu(e: MouseEvent) {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect) return

  const coords = getCanvasCoords(e)
  if (coords) {
    const element = findElementAt(coords.x, coords.y)
    if (element && !canvasStore.selectedElementIds.includes(element.id)) {
      canvasStore.selectElement(element.id, e.shiftKey)
    }
  }

  contextMenu.value = {
    visible: true,
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function selectStrip(
  mode: 'horizontal' | 'vertical',
  coords: { x: number; y: number }
) {
  const thickness = Math.max(1, Math.round(toolStore.toolOptions.stripThickness))
  const half = Math.floor(thickness / 2)
  let x1 = 0
  let x2 = oledWidth.value
  let y1 = 0
  let y2 = oledHeight.value

  if (mode === 'horizontal') {
    y1 = Math.max(0, coords.y - half)
    y2 = Math.min(oledHeight.value, coords.y + half)
  } else {
    x1 = Math.max(0, coords.x - half)
    x2 = Math.min(oledWidth.value, coords.x + half)
  }

  const targets = projectStore.currentPage.elements.filter(el => {
    const elX1 = el.x
    const elX2 = el.x + el.width
    const elY1 = el.y
    const elY2 = el.y + el.height
    const overlapX = !(elX2 < x1 || elX1 > x2)
    const overlapY = !(elY2 < y1 || elY1 > y2)
    return overlapX && overlapY
  })
  canvasStore.selectElements(targets.map(el => el.id))
}

// Drawing functions
function renderGrid() {
  const canvas = gridCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!canvasStore.showGrid) return

  // Draw pixel grid
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 0.5

  for (let x = 0; x <= oledWidth.value; x++) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, oledHeight.value)
    ctx.stroke()
  }

  for (let y = 0; y <= oledHeight.value; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(oledWidth.value, y)
    ctx.stroke()
  }
}

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

function renderAlignmentGuides() {
  const canvas = previewCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Render guides on top of preview
  alignmentGuides.renderGuides(ctx, 1)
}

function renderPreview() {
  const canvas = previewCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Text box preview (dashed rect)
  if (textPreviewRect.value) {
    const rect = textPreviewRect.value
    ctx.save()
    ctx.setLineDash([3, 3])
    ctx.strokeStyle = '#00aaff'
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
    ctx.restore()
    return
  }

  if (!canvasStore.isDrawing || !canvasStore.drawStartPoint || !canvasStore.drawCurrentPoint) return

  const start = canvasStore.drawStartPoint
  const current = canvasStore.drawCurrentPoint
  const color = toolStore.toolOptions.color === 1 ? '#00ff00' : '#1a1a1a'

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1

  const tool = toolStore.currentTool

  switch (tool) {
    case 'line':
      drawLine(ctx, start.x, start.y, current.x, current.y, color)
      break
    case 'rect':
      drawRect(ctx, start.x, start.y, current.x - start.x, current.y - start.y, toolStore.toolOptions.fill, color)
      break
    case 'circle': {
      const radius = Math.round(Math.sqrt(Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2)))
      drawCircle(ctx, start.x, start.y, radius, toolStore.toolOptions.fill, color)
      break
    }
    case 'ellipse': {
      const rx = Math.abs(current.x - start.x)
      const ry = Math.abs(current.y - start.y)
      drawEllipse(ctx, start.x, start.y, rx, ry, toolStore.toolOptions.fill, color)
      break
    }
    case 'roundRect':
      drawRoundRect(ctx, start.x, start.y, current.x - start.x, current.y - start.y, toolStore.toolOptions.cornerRadius, toolStore.toolOptions.fill, color)
      break
  }
}

// Event handlers
function getCanvasCoords(e: MouseEvent): { x: number; y: number } | null {
  const canvas = mainCanvasRef.value
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((e.clientX - rect.left) / canvasStore.scale)
  const y = Math.floor((e.clientY - rect.top) / canvasStore.scale)

  if (x < 0 || x >= oledWidth.value || y < 0 || y >= oledHeight.value) {
    return null
  }

  return { x, y }
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  if (e.deltaY < 0) {
    canvasStore.zoomIn()
  } else {
    canvasStore.zoomOut()
  }
}

function handleMouseDown(e: MouseEvent) {
  // 关闭正在编辑的文本框
  if (textOverlay.value.visible) {
    cancelTextOverlay()
  }
  hideContextMenu()
  // Middle button for panning
  if (e.button === 1) {
    isPanning.value = true
    lastPanPoint.value = { x: e.clientX, y: e.clientY }
    return
  }

  if (e.button !== 0) return

  const coords = getCanvasCoords(e)
  if (!coords) return

  const tool = toolStore.currentTool

  if (tool === 'hStripSelect') {
    selectStrip('horizontal', coords)
    return
  } else if (tool === 'vStripSelect') {
    selectStrip('vertical', coords)
    return
  } else if (tool === 'select') {
    // Find element at position
    const clickedElement = findElementAt(coords.x, coords.y)
    if (clickedElement) {
      canvasStore.selectElement(clickedElement.id, e.shiftKey)
      startElementDrag(coords)
    } else {
      canvasStore.clearSelection()
      isDraggingElement.value = false
    }
  } else if (tool === 'pixel') {
    // Draw single pixel
    const color = toolStore.toolOptions.color
    projectStore.addElement({
      type: 'pixel',
      x: coords.x,
      y: coords.y,
      width: 1,
      height: 1,
      visible: true,
      locked: false,
      zIndex: projectStore.currentPage.elements.length,
      properties: { color }
    })
    renderElements()
  } else if (tool === 'eraser') {
    // Erase pixel at position
    const elementAtPos = findElementAt(coords.x, coords.y)
    if (elementAtPos) {
      projectStore.deleteElement(elementAtPos.id)
      renderElements()
    }
  } else if (tool === 'text') {
    // 文本工具：拖拽绘制文本框，之后在框内输入
    textOverlay.value.visible = false
    textDrawStart.value = coords
    textPreviewRect.value = { x: coords.x, y: coords.y, width: 1, height: 1 }
    renderPreview()
  } else if (tool === 'image') {
    handleImageImport(coords)
  } else {
    // Start drawing shape
    canvasStore.startDrawing(coords.x, coords.y)
  }
}

async function handleDoubleClick(e: MouseEvent) {
  const coords = getCanvasCoords(e)
  if (!coords) return
  const element = findElementAt(coords.x, coords.y)
  if (!element || element.type !== 'text') return

  const fontSize = element.properties.fontSize || toolStore.toolOptions.fontSize
  const width = element.width || (element.properties.text?.length || 1) * fontSize
  const height = element.height || fontSize * 2

  textOverlay.value = {
    visible: true,
    x: element.x,
    y: element.y,
    width,
    height,
    value: element.properties.text || '',
    elementId: element.id,
    color: element.properties.color ?? 1,
    fontSize,
    align: element.properties.align || 'left'
  }
  textPreviewRect.value = null
  textDrawStart.value = null
  renderPreview()
}

function cancelTextOverlay() {
  textOverlay.value.visible = false
  textPreviewRect.value = null
  textDrawStart.value = null
  renderPreview()
}

function confirmTextOverlay() {
  if (!textOverlay.value.visible) return
  const box = textOverlay.value
  const text = box.value.trim()
  if (text === '') {
    cancelTextOverlay()
    return
  }

  const fontSize = Number(box.fontSize) as 6 | 8 | 12 | 16 | 24
  const color = box.color as 0 | 1
  const align = box.align as 'left' | 'center' | 'right'

  if (box.elementId) {
    projectStore.updateElement(box.elementId, {
      x: box.x,
      y: box.y,
      width: Math.round(box.width),
      height: Math.round(box.height),
      properties: {
        ...projectStore.currentPage.elements.find(el => el.id === box.elementId)?.properties,
        text,
        fontSize,
        color,
        align
      }
    })
  } else {
    projectStore.addElement({
      type: 'text',
      x: box.x,
      y: box.y,
      width: Math.round(box.width),
      height: Math.round(box.height),
      visible: true,
      locked: false,
      zIndex: projectStore.currentPage.elements.length,
      properties: {
        text,
        fontSize,
        color,
        align
      }
    })
  }

  renderElements()
  projectStore.saveToHistory()
  cancelTextOverlay()
}

function getTextOverlayStyle() {
  const scale = canvasStore.scale
  return {
    left: `${textOverlay.value.x * scale}px`,
    top: `${textOverlay.value.y * scale}px`,
    width: `${Math.max(1, textOverlay.value.width) * scale}px`,
    height: `${Math.max(1, textOverlay.value.height) * scale}px`,
    color: textOverlay.value.color === 1 ? '#00ff00' : '#1a1a1a',
    textAlign: textOverlay.value.align
  }
}

function startOverlayDrag(e: MouseEvent) {
  textOverlayDrag.value = true
  textOverlayDragStart.value = {
    x: e.clientX,
    y: e.clientY,
    boxX: textOverlay.value.x,
    boxY: textOverlay.value.y,
    w: textOverlay.value.width,
    h: textOverlay.value.height
  }
}

function startOverlayResize(handle: 'nw' | 'ne' | 'sw' | 'se', e: MouseEvent) {
  textOverlayResizeHandle.value = handle
  textOverlayDragStart.value = {
    x: e.clientX,
    y: e.clientY,
    boxX: textOverlay.value.x,
    boxY: textOverlay.value.y,
    w: textOverlay.value.width,
    h: textOverlay.value.height
  }
}

function handleOverlayMove(e: MouseEvent) {
  if (!textOverlayDragStart.value) return
  const start = textOverlayDragStart.value
  const dx = (e.clientX - start.x) / canvasStore.scale
  const dy = (e.clientY - start.y) / canvasStore.scale

  if (textOverlayDrag.value) {
    let nx = start.boxX + dx
    let ny = start.boxY + dy
    nx = Math.max(0, Math.min(nx, oledWidth.value - textOverlay.value.width))
    ny = Math.max(0, Math.min(ny, oledHeight.value - textOverlay.value.height))
    textOverlay.value.x = Math.round(nx)
    textOverlay.value.y = Math.round(ny)
  } else if (textOverlayResizeHandle.value) {
    let { boxX: x, boxY: y, w, h } = start
    let nx = x
    let ny = y
    let nw = w
    let nh = h

    switch (textOverlayResizeHandle.value) {
      case 'nw':
        nx = x + dx
        ny = y + dy
        nw = w - dx
        nh = h - dy
        break
      case 'ne':
        ny = y + dy
        nw = w + dx
        nh = h - dy
        break
      case 'sw':
        nx = x + dx
        nw = w - dx
        nh = h + dy
        break
      case 'se':
        nw = w + dx
        nh = h + dy
        break
    }

    nw = Math.max(8, Math.min(nw, oledWidth.value - nx))
    nh = Math.max(textOverlay.value.fontSize * 2, Math.min(nh, oledHeight.value - ny))
    nx = Math.max(0, Math.min(nx, oledWidth.value - nw))
    ny = Math.max(0, Math.min(ny, oledHeight.value - nh))

    textOverlay.value.x = Math.round(nx)
    textOverlay.value.y = Math.round(ny)
    textOverlay.value.width = Math.round(nw)
    textOverlay.value.height = Math.round(nh)
  }
}

function handleOverlayMouseUp() {
  textOverlayDrag.value = false
  textOverlayResizeHandle.value = null
  textOverlayDragStart.value = null
}

function handleMouseMove(e: MouseEvent) {
  const coords = getCanvasCoords(e)
  mouseCoords.value = coords

  // 文本框绘制预览
  if (textDrawStart.value && coords && toolStore.currentTool === 'text') {
    const start = textDrawStart.value
    const x = Math.min(start.x, coords.x)
    const y = Math.min(start.y, coords.y)
  const width = Math.abs(coords.x - start.x)
  const height = Math.abs(coords.y - start.y)
  textPreviewRect.value = { x, y, width, height }
  renderPreview()
  return
  }

  if (isPanning.value && lastPanPoint.value) {
    const dx = e.clientX - lastPanPoint.value.x
    const dy = e.clientY - lastPanPoint.value.y
    canvasStore.pan(dx, dy)
    lastPanPoint.value = { x: e.clientX, y: e.clientY }
    return
  }

  // Element resize
  if (isResizing.value && resizeElement.value && resizeStart.value && dragStartPoint.value && coords) {
    const { x: sx, y: sy, width, height } = resizeStart.value
    let newX = sx
    let newY = sy
    let newW = width
    let newH = height
    const dx = coords.x - dragStartPoint.value.x
    const dy = coords.y - dragStartPoint.value.y

    switch (resizeHandle.value) {
      case 'nw':
        newX = sx + dx
        newY = sy + dy
        newW = width - dx
        newH = height - dy
        break
      case 'ne':
        newY = sy + dy
        newW = width + dx
        newH = height - dy
        break
      case 'sw':
        newX = sx + dx
        newW = width - dx
        newH = height + dy
        break
      case 'se':
        newW = width + dx
        newH = height + dy
        break
    }

    newW = Math.max(1, Math.round(newW))
    newH = Math.max(1, Math.round(newH))
    newX = Math.round(newX)
    newY = Math.round(newY)

    // 圆形保持正方形缩放，锚点取对角不动
    if (resizeElement.value.type === 'circle') {
      const size = Math.max(newW, newH)
      switch (resizeHandle.value) {
        case 'nw': {
          const anchorX = sx + width
          const anchorY = sy + height
          newW = size
          newH = size
          newX = anchorX - size
          newY = anchorY - size
          break
        }
        case 'ne': {
          const anchorX = sx
          const anchorY = sy + height
          newW = size
          newH = size
          newX = anchorX
          newY = anchorY - size
          break
        }
        case 'sw': {
          const anchorX = sx + width
          const anchorY = sy
          newW = size
          newH = size
          newX = anchorX - size
          newY = anchorY
          break
        }
        case 'se':
        default:
          newW = size
          newH = size
          newX = sx
          newY = sy
          break
      }
    }

    resizeElement.value.x = newX
    resizeElement.value.y = newY
    resizeElement.value.width = newW
    resizeElement.value.height = newH
    projectStore.isDirty = true
    renderElements()
    renderPreview()
    return
  }

  // Element drag with alignment guides
  if (isDraggingElement.value && dragStartPoint.value && coords) {
    const dx = coords.x - dragStartPoint.value.x
    const dy = coords.y - dragStartPoint.value.y
    for (const item of dragElements.value) {
      const el = projectStore.currentPage.elements.find(e => e.id === item.id)
      if (el && !el.locked) {
        let newX = item.startX + dx
        let newY = item.startY + dy

        // Apply snap alignment
        const snapped = alignmentGuides.calculateSnap(newX, newY, el.width, el.height)
        el.x = snapped.x
        el.y = snapped.y
      }
    }
    projectStore.isDirty = true
    renderElements()
    renderPreview()
    renderAlignmentGuides()
    return
  }

  if (canvasStore.isDrawing && coords) {
    canvasStore.updateDrawing(coords.x, coords.y)
    renderPreview()
  }

  // Pixel drawing while dragging
  if (e.buttons === 1 && coords) {
    const tool = toolStore.currentTool
    if (tool === 'pixel') {
      projectStore.addElement({
        type: 'pixel',
        x: coords.x,
        y: coords.y,
        width: 1,
        height: 1,
        visible: true,
        locked: false,
        zIndex: projectStore.currentPage.elements.length,
        properties: { color: toolStore.toolOptions.color }
      })
      renderElements()
    } else if (tool === 'eraser') {
      const elementAtPos = findElementAt(coords.x, coords.y)
      if (elementAtPos) {
        projectStore.deleteElement(elementAtPos.id)
        renderElements()
      }
    }
  }
}

function handleMouseUp(e: MouseEvent) {
  if (textOverlayDrag.value || textOverlayResizeHandle.value) {
    textOverlayDrag.value = false
    textOverlayResizeHandle.value = null
    textOverlayDragStart.value = null
    return
  }

  // 完成文本框绘制
  if (textDrawStart.value && toolStore.currentTool === 'text') {
    const end = mouseCoords.value || textDrawStart.value
    const start = textDrawStart.value
    let x = Math.min(start.x, end.x)
    let y = Math.min(start.y, end.y)
    let width = Math.max(8, Math.abs(end.x - start.x))
    let height = Math.max(toolStore.toolOptions.fontSize * 2, Math.abs(end.y - start.y))

    // 若仅单击，没有拖拽，给默认尺寸
    if (width === 0) width = toolStore.toolOptions.fontSize * 4
    if (height === 0) height = toolStore.toolOptions.fontSize * 2

    // Clamp inside canvas
    width = Math.min(width, oledWidth.value - x)
    height = Math.min(height, oledHeight.value - y)
    textOverlay.value = {
      visible: true,
      x,
      y,
      width,
      height,
      value: '',
      elementId: null,
      color: toolStore.toolOptions.color as 0 | 1,
      fontSize: toolStore.toolOptions.fontSize,
      align: toolStore.toolOptions.textAlign
    }
    textDrawStart.value = null
    textPreviewRect.value = null
    renderPreview()
    return
  }

  if (isPanning.value) {
    isPanning.value = false
    lastPanPoint.value = null
    return
  }

  if (isResizing.value) {
    isResizing.value = false
    resizeHandle.value = null
    resizeElement.value = null
    resizeStart.value = null
    dragStartPoint.value = null
    projectStore.saveToHistory()
    renderElements()
    return
  }

  if (isDraggingElement.value) {
    isDraggingElement.value = false
    dragElements.value = []
    dragStartPoint.value = null
    alignmentGuides.clearGuides()
    projectStore.saveToHistory()
    renderElements()
    renderPreview()
    return
  }

  if (!canvasStore.isDrawing) return

  const start = canvasStore.drawStartPoint
  const end = canvasStore.drawCurrentPoint
  if (!start || !end) {
    canvasStore.endDrawing()
    return
  }

  const tool = toolStore.currentTool
  const color = toolStore.toolOptions.color

  let element: Omit<Element, 'id'> | null = null

  switch (tool) {
    case 'line':
      element = {
        type: 'line',
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x) || 1,
        height: Math.abs(end.y - start.y) || 1,
        visible: true,
        locked: false,
        zIndex: projectStore.currentPage.elements.length,
        properties: {
          color,
          x2: end.x - Math.min(start.x, end.x),
          y2: end.y - Math.min(start.y, end.y)
        }
      }
      // Adjust for line positioning
      element.properties.x2 = end.x - start.x
      element.properties.y2 = end.y - start.y
      element.x = start.x
      element.y = start.y
      break

    case 'rect':
      element = {
        type: 'rect',
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x) || 1,
        height: Math.abs(end.y - start.y) || 1,
        visible: true,
        locked: false,
        zIndex: projectStore.currentPage.elements.length,
        properties: {
          color,
          fill: toolStore.toolOptions.fill
        }
      }
      break

    case 'circle': {
      const radius = Math.round(Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)))
      element = {
        type: 'circle',
        x: start.x - radius,
        y: start.y - radius,
        width: radius * 2,
        height: radius * 2,
        visible: true,
        locked: false,
        zIndex: projectStore.currentPage.elements.length,
        properties: {
          color,
          fill: toolStore.toolOptions.fill
        }
      }
      break
    }

    case 'ellipse':
      element = {
        type: 'ellipse',
        x: start.x - Math.abs(end.x - start.x),
        y: start.y - Math.abs(end.y - start.y),
        width: Math.abs(end.x - start.x) * 2 || 1,
        height: Math.abs(end.y - start.y) * 2 || 1,
        visible: true,
        locked: false,
        zIndex: projectStore.currentPage.elements.length,
        properties: {
          color,
          fill: toolStore.toolOptions.fill
        }
      }
      break

    case 'roundRect':
      element = {
        type: 'roundRect',
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x) || 1,
        height: Math.abs(end.y - start.y) || 1,
        visible: true,
        locked: false,
        zIndex: projectStore.currentPage.elements.length,
        properties: {
          color,
          fill: toolStore.toolOptions.fill,
          radius: toolStore.toolOptions.cornerRadius
        }
      }
      break
  }

  if (element) {
    projectStore.addElement(element)
    renderElements()
  }

  canvasStore.endDrawing()
  renderPreview()
}

async function handleImageImport(coords: { x: number; y: number }) {
  const result = await window.electronAPI.importImage()
  if (result.success && result.dataUrl) {
    projectStore.addElement({
      type: 'image',
      x: coords.x,
      y: coords.y,
      width: 32,
      height: 32,
      visible: true,
      locked: false,
      zIndex: projectStore.currentPage.elements.length,
      properties: {
        imageData: result.dataUrl,
        threshold: toolStore.toolOptions.threshold,
        dithering: toolStore.toolOptions.dithering
      }
    })
    renderElements()
  }
}

function findElementAt(x: number, y: number): Element | null {
  // Search from top to bottom (highest zIndex first)
  const sortedElements = [...projectStore.currentPage.elements].sort((a, b) => b.zIndex - a.zIndex)

  for (const element of sortedElements) {
    if (!element.visible || element.locked) continue

    // 文字元素缺省宽高时，按内容估算包围盒
    const fallbackWidth =
      element.type === 'text'
        ? Math.max(element.width || 0, (element.properties.text?.length || 1) * (element.properties.fontSize || 8))
        : element.width
    const fallbackHeight =
      element.type === 'text'
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

function isResizable(element: Element) {
  return element.type !== 'pixel'
}

function copySelected() {
  if (selectedElements.value.length === 0) {
    hideContextMenu()
    return
  }
  canvasStore.setClipboard(selectedElements.value)
  hideContextMenu()
}

function pasteClipboard() {
  if (canvasStore.clipboard.length === 0) {
    hideContextMenu()
    return
  }
  canvasStore.clipboard.forEach(el => {
    projectStore.addElement({
      ...el,
      x: el.x + 5,
      y: el.y + 5,
      properties: { ...el.properties }
    })
  })
  renderElements()
  hideContextMenu()
}

function deleteSelection() {
  if (canvasStore.selectedElementIds.length === 0) {
    hideContextMenu()
    return
  }
  projectStore.deleteSelectedElements(canvasStore.selectedElementIds)
  canvasStore.clearSelection()
  renderElements()
  hideContextMenu()
}

function toggleLockSelection() {
  if (selectedElements.value.length === 0) return
  const target = !allLocked.value
  selectedElements.value.forEach(el => {
    el.locked = target
  })
  projectStore.saveToHistory()
  hideContextMenu()
}

function toggleVisibilitySelection() {
  if (selectedElements.value.length === 0) return
  const target = allHidden.value
  selectedElements.value.forEach(el => {
    el.visible = target
  })
  projectStore.saveToHistory()
  renderElements()
  hideContextMenu()
}

function bringSelectionToFront() {
  if (selectedElements.value.length === 0) return
  const elements = projectStore.currentPage.elements
  let z = Math.max(...elements.map(el => el.zIndex))
  const sorted = [...selectedElements.value].sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach(el => {
    el.zIndex = ++z
  })
  projectStore.saveToHistory()
  renderElements()
  hideContextMenu()
}

function sendSelectionToBack() {
  if (selectedElements.value.length === 0) return
  const elements = projectStore.currentPage.elements
  let z = Math.min(...elements.map(el => el.zIndex)) - selectedElements.value.length
  const sorted = [...selectedElements.value].sort((a, b) => a.zIndex - b.zIndex)
  sorted.forEach(el => {
    el.zIndex = z++
  })
  projectStore.saveToHistory()
  renderElements()
  hideContextMenu()
}

function alignSelection(direction: 'left' | 'right' | 'top' | 'bottom') {
  if (selectedElements.value.length < 2) return
  const xs = selectedElements.value.map(el => el.x)
  const ys = selectedElements.value.map(el => el.y)
  const rights = selectedElements.value.map(el => el.x + el.width)
  const bottoms = selectedElements.value.map(el => el.y + el.height)

  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxRight = Math.max(...rights)
  const maxBottom = Math.max(...bottoms)

  selectedElements.value.forEach(el => {
    switch (direction) {
      case 'left':
        el.x = minX
        break
      case 'right':
        el.x = maxRight - el.width
        break
      case 'top':
        el.y = minY
        break
      case 'bottom':
        el.y = maxBottom - el.height
        break
    }
  })
  projectStore.saveToHistory()
  renderElements()
  hideContextMenu()
}

function selectAll() {
  const ids = projectStore.currentPage.elements.map(el => el.id)
  canvasStore.selectElements(ids)
  hideContextMenu()
}

function toggleGrid() {
  canvasStore.toggleGrid()
  renderGrid()
  hideContextMenu()
}

function onGlobalMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (target && target.closest('.context-menu')) return
  hideContextMenu()
}

function startElementDrag(coords: { x: number; y: number }) {
  const selectedIds = canvasStore.selectedElementIds
  if (selectedIds.length === 0) return
  dragElements.value = selectedIds.map(id => {
    const el = projectStore.currentPage.elements.find(e => e.id === id)!
    return { id, startX: el.x, startY: el.y }
  })
  dragStartPoint.value = coords
  isDraggingElement.value = true
  isResizing.value = false
}

function handleResizeMouseDown(element: Element, handle: 'nw' | 'ne' | 'sw' | 'se', e: MouseEvent) {
  if (!isResizable(element)) return
  if (!canvasStore.selectedElementIds.includes(element.id)) {
    canvasStore.selectElement(element.id)
  }
  const coords = getCanvasCoords(e)
  if (!coords) return
  resizeElement.value = element
  resizeHandle.value = handle
  resizeStart.value = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height
  }
  dragStartPoint.value = coords
  isResizing.value = true
  isDraggingElement.value = false
}

// Watch for changes
watch(() => projectStore.currentPage, () => {
  nextTick(() => {
    renderGrid()
    renderElements()
  })
}, { deep: true })

watch(() => canvasStore.showGrid, () => {
  renderGrid()
})

watch(() => [oledWidth.value, oledHeight.value], () => {
  nextTick(() => {
    renderGrid()
    renderElements()
  })
})

// Keyboard shortcuts
const { saveProject, openProject, newProject } = useKeyboardShortcuts({
  onCopy: copySelected,
  onPaste: pasteClipboard,
  onDelete: deleteSelection,
  onSelectAll: selectAll,
  onRender: () => {
    renderElements()
    renderPreview()
  }
})

onMounted(() => {
  renderGrid()
  renderElements()
  window.addEventListener('mousedown', onGlobalMouseDown)
  window.addEventListener('scroll', hideContextMenu)
  window.addEventListener('mousemove', handleOverlayMove)
  window.addEventListener('mouseup', handleOverlayMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', onGlobalMouseDown)
  window.removeEventListener('scroll', hideContextMenu)
  window.removeEventListener('mousemove', handleOverlayMove)
  window.removeEventListener('mouseup', handleOverlayMouseUp)
})
</script>

<style scoped>
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #121212;
  overflow: hidden;
  position: relative;
}

.canvas-wrapper {
  position: relative;
  transition: transform 0.1s ease-out;
}

.oled-frame {
  position: relative;
  background-color: #000;
  border: 2px solid #444;
  border-radius: 4px;
  box-shadow: 0 0 20px rgba(0, 255, 0, 0.1);
  image-rendering: pixelated;
}

.grid-canvas,
.main-canvas,
.preview-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.grid-canvas {
  z-index: 1;
  pointer-events: none;
  opacity: 0.3;
}

.main-canvas {
  z-index: 2;
}

.preview-canvas {
  z-index: 3;
  pointer-events: none;
}

.text-edit-overlay {
  position: absolute;
  z-index: 20;
  border: 1px dashed #00aaff;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 6px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.text-edit-area {
  width: 100%;
  height: 100%;
  resize: none;
  background: transparent;
  border: none;
  outline: none;
  color: inherit;
  font-family: monospace;
}

.text-edit-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.text-edit-toolbar {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.overlay-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #00aaff;
  border: 1px solid #fff;
}

.overlay-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
.overlay-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
.overlay-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.overlay-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }

.selection-box {
  position: absolute;
  border: 1px dashed #00aaff;
  z-index: 10;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: #00aaff;
  border: 1px solid #fff;
  pointer-events: auto;
}

.resize-handle.nw { top: -3px; left: -3px; cursor: nw-resize; }
.resize-handle.ne { top: -3px; right: -3px; cursor: ne-resize; }
.resize-handle.sw { bottom: -3px; left: -3px; cursor: sw-resize; }
.resize-handle.se { bottom: -3px; right: -3px; cursor: se-resize; }

.coords-display {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  color: var(--text-secondary);
}

.context-menu {
  position: absolute;
  background-color: #1f1f1f;
  border: 1px solid #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  border-radius: 6px;
  padding: 6px 0;
  z-index: 20;
  min-width: 180px;
}

.context-menu .menu-item {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-secondary);
}

.context-menu .menu-item:hover {
  background-color: #2a2a2a;
  color: var(--text-primary);
}

.context-menu .menu-item.danger {
  color: #f56c6c;
}

.context-menu .menu-item.strong {
  font-weight: 600;
  cursor: default;
}

.context-menu .menu-divider {
  height: 1px;
  margin: 4px 0;
  background-color: #333;
}
</style>
