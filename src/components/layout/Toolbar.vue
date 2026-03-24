<template>
  <div class="toolbar" :style="{ width: toolbarWidth + 'px' }">
    <div class="resize-handle" @mousedown="startResize"></div>
    <div class="tool-section">
      <div class="section-title">工具</div>
      <div class="tool-grid">
        <el-tooltip content="选择 (V)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'select' }"
            @click="setTool('select')"
          >
            <el-icon><Pointer /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="水平条形选中 (H)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'hStripSelect' }"
            @click="setTool('hStripSelect')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <rect x="3" y="6" width="18" height="4" fill="none" stroke="currentColor" stroke-width="2" />
              <rect x="3" y="14" width="18" height="4" fill="currentColor" opacity="0.35" />
            </svg>
          </div>
        </el-tooltip>

        <el-tooltip content="垂直条形选中 (J)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'vStripSelect' }"
            @click="setTool('vStripSelect')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <rect x="6" y="3" width="4" height="18" fill="none" stroke="currentColor" stroke-width="2" />
              <rect x="14" y="3" width="4" height="18" fill="currentColor" opacity="0.35" />
            </svg>
          </div>
        </el-tooltip>

        <el-tooltip content="像素点 (P)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'pixel' }"
            @click="setTool('pixel')"
          >
            <el-icon><Aim /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="直线 (L)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'line' }"
            @click="setTool('line')"
          >
            <el-icon><Minus /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="矩形 (R)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'rect' }"
            @click="setTool('rect')"
          >
            <el-icon><FullScreen /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="圆形 (C)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'circle' }"
            @click="setTool('circle')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
        </el-tooltip>

        <el-tooltip content="椭圆 (E)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'ellipse' }"
            @click="setTool('ellipse')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <ellipse cx="12" cy="12" rx="10" ry="6" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
        </el-tooltip>

        <el-tooltip content="圆角矩形" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'roundRect' }"
            @click="setTool('roundRect')"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
        </el-tooltip>

        <el-tooltip content="文字 (T)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'text' }"
            @click="setTool('text')"
          >
            <el-icon><EditPen /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="图片 (I)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'image' }"
            @click="setTool('image')"
          >
            <el-icon><Picture /></el-icon>
          </div>
        </el-tooltip>

        <el-tooltip content="橡皮擦 (X)" placement="right">
          <div
            class="tool-btn"
            :class="{ active: currentTool === 'eraser' }"
            @click="setTool('eraser')"
          >
            <el-icon><Delete /></el-icon>
          </div>
        </el-tooltip>
      </div>
    </div>

    <el-divider />

    <div class="tool-section">
      <div class="section-title">颜色</div>
      <div class="color-picker">
        <div
          class="color-btn"
          :class="{ active: toolOptions.color === 1 }"
          @click="setOption('color', 1)"
        >
          <div class="color-preview white"></div>
          <span>白</span>
        </div>
        <div
          class="color-btn"
          :class="{ active: toolOptions.color === 0 }"
          @click="setOption('color', 0)"
        >
          <div class="color-preview black"></div>
          <span>黑</span>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="tool-section">
      <div class="section-title">填充</div>
      <el-switch
        v-model="fillEnabled"
        size="small"
        active-text="填充"
        inactive-text="描边"
      />
    </div>

    <el-divider />

    <div class="tool-section">
      <div class="section-title">条形选中宽度</div>
      <el-slider
        v-model="stripThickness"
        :min="1"
        :max="oledHeight"
        size="small"
        :step="1"
        show-input
      />
    </div>

    <el-divider />

    <div class="tool-section">
      <div class="section-title">字体大小</div>
      <el-select v-model="fontSize" size="small" style="width: 100%">
        <el-option :value="6" label="6x8" />
        <el-option :value="8" label="8x16" />
        <el-option :value="12" label="12x24" />
        <el-option :value="16" label="16x32" />
        <el-option :value="24" label="24x48" />
      </el-select>
    </div>

    <div class="spacer"></div>

    <div class="tool-section">
      <div class="section-title">缩放</div>
      <div class="zoom-controls">
        <el-button size="small" @click="canvasStore.zoomOut">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
        <span class="zoom-value">{{ Math.round(canvasStore.scale * 100) }}%</span>
        <el-button size="small" @click="canvasStore.zoomIn">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
      </div>
      <el-button size="small" style="width: 100%; margin-top: 8px" @click="canvasStore.resetView">
        重置视图
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useToolStore } from '@/stores/tools'
import { useCanvasStore } from '@/stores/canvas'
import { useProjectStore } from '@/stores/project'
import type { ToolType } from '@/types'

const toolStore = useToolStore()
const canvasStore = useCanvasStore()
const projectStore = useProjectStore()

const currentTool = computed(() => toolStore.currentTool)
const toolOptions = computed(() => toolStore.toolOptions)
const oledHeight = computed(() => projectStore.config.oled.height)

const fillEnabled = computed({
  get: () => toolStore.toolOptions.fill,
  set: (val) => toolStore.setOption('fill', val)
})

const fontSize = computed({
  get: () => toolStore.toolOptions.fontSize,
  set: (val) => toolStore.setOption('fontSize', val as 6 | 8 | 12 | 16 | 24)
})

const stripThickness = computed({
  get: () => toolStore.toolOptions.stripThickness,
  set: (val: number) => toolStore.setOption('stripThickness', val)
})

// Toolbar width (user adjustable via drag handle)
function loadToolbarWidth(): number {
  const saved = Number(localStorage.getItem('toolbarWidth'))
  return Number.isFinite(saved) && saved > 0 ? saved : 72
}
const toolbarWidth = ref<number>(loadToolbarWidth())
const isResizing = ref(false)

function startResize(e: MouseEvent) {
  isResizing.value = true
  e.preventDefault()
}

function handleResizeMove(e: MouseEvent) {
  if (!isResizing.value) return
  const next = Math.min(220, Math.max(60, e.clientX))
  toolbarWidth.value = next
  localStorage.setItem('toolbarWidth', String(next))
}

function stopResize() {
  isResizing.value = false
}

function setTool(tool: ToolType) {
  toolStore.setTool(tool)
}

function setOption<K extends keyof typeof toolOptions.value>(key: K, value: typeof toolOptions.value[K]) {
  toolStore.setOption(key, value)
}

// Keyboard shortcuts for tools
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

  const toolMap: Record<string, ToolType> = {
    'v': 'select',
    'h': 'hStripSelect',
    'j': 'vStripSelect',
    'p': 'pixel',
    'l': 'line',
    'r': 'rect',
    'c': 'circle',
    'e': 'ellipse',
    't': 'text',
    'i': 'image',
    'x': 'eraser'
  }

  const tool = toolMap[e.key.toLowerCase()]
  if (tool) {
    setTool(tool)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('mousemove', handleResizeMove)
  window.addEventListener('mouseup', stopResize)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mousemove', handleResizeMove)
  window.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  width: v-bind(toolbarWidth + 'px');
  position: relative;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 12px 8px;
  overflow-y: auto;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
}

.tool-section {
  margin-bottom: 8px;
}

.section-title {
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-align: center;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.tool-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.tool-btn.active {
  background-color: var(--accent-color);
  color: white;
}

.color-picker {
  display: flex;
  gap: 4px;
}

.color-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  color: var(--text-muted);
}

.color-btn:hover {
  background-color: var(--bg-hover);
}

.color-btn.active {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.color-preview.white {
  background-color: #00ff00;
}

.color-preview.black {
  background-color: #1a1a1a;
}

.spacer {
  flex: 1;
}

.zoom-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.zoom-value {
  font-size: 11px;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: center;
}

.el-divider {
  margin: 8px 0;
}
</style>
