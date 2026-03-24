<template>
  <div class="property-panel">
    <div class="panel-header">
      <span>属性</span>
    </div>

    <el-scrollbar>
      <div class="panel-content">
        <!-- Page properties when no selection -->
        <div v-if="selectedElements.length === 0">
          <div class="property-group">
            <div class="group-title">页面</div>

            <div class="property-row">
              <span class="property-label">名称</span>
              <el-input
                v-model="pageName"
                size="small"
                placeholder="页面名称"
                @change="commitPageMeta"
              />
            </div>

            <div class="property-row">
              <span class="property-label">背景</span>
              <el-radio-group v-model="pageBackground" size="small" @change="commitPageMeta">
                <el-radio-button :value="0">黑</el-radio-button>
                <el-radio-button :value="1">白</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <div class="property-group">
            <div class="group-title">页面跳转条件</div>

            <div class="link-row" v-if="currentPage.links.length === 0">
              <span class="property-label muted">暂无跳转，点击下方添加</span>
            </div>

            <div
              class="link-row"
              v-for="(link, idx) in currentPage.links"
              :key="link.id"
            >
              <el-select
                v-model="link.trigger"
                size="small"
                style="width: 120px"
                @change="commitPageLinks"
              >
                <el-option value="KEY_UP" label="按键-上" />
                <el-option value="KEY_DOWN" label="按键-下" />
                <el-option value="KEY_LEFT" label="按键-左" />
                <el-option value="KEY_RIGHT" label="按键-右" />
                <el-option value="KEY_OK" label="按键-确认" />
                <el-option value="KEY_BACK" label="按键-返回" />
                <el-option value="TIMER" label="定时器" />
                <el-option value="CONDITION" label="条件表达式" />
              </el-select>

              <el-select
                v-model="link.targetPageId"
                size="small"
                style="width: 140px"
                @change="commitPageLinks"
              >
                <el-option
                  v-for="p in projectStore.pages"
                  :key="p.id"
                  :value="p.id"
                  :label="p.name"
                />
              </el-select>

              <el-select
                v-model="link.transition"
                size="small"
                style="width: 120px"
                @change="commitPageLinks"
              >
                <el-option value="NONE" label="无过渡" />
                <el-option value="SLIDE_LEFT" label="左滑" />
                <el-option value="SLIDE_RIGHT" label="右滑" />
                <el-option value="FADE" label="淡入" />
              </el-select>

              <el-input-number
                v-if="link.trigger === 'TIMER'"
                v-model="link.timerMs"
                :min="100"
                :max="60000"
                :step="100"
                size="small"
                style="width: 120px"
                @change="commitPageLinks"
              />

              <el-input
                v-if="link.trigger === 'CONDITION'"
                v-model="link.condition"
                size="small"
                placeholder="C 表达式条件"
                style="flex: 1"
                @change="commitPageLinks"
              />

              <el-button
                size="small"
                text
                type="danger"
                @click="removePageLink(idx)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <el-button size="small" @click="addPageLink">
              <el-icon><Plus /></el-icon>添加跳转
            </el-button>
          </div>
        </div>

        <!-- Single Element Selected -->
        <template v-else-if="selectedElements.length === 1">
          <div class="property-group">
            <div class="group-title">基本属性</div>

            <div class="property-row">
              <span class="property-label">类型</span>
              <span class="property-value">{{ getTypeName(selectedElement.type) }}</span>
            </div>

            <div class="property-row">
              <span class="property-label">可见</span>
              <el-switch v-model="elementVisible" size="small" />
            </div>

            <div class="property-row">
              <span class="property-label">锁定</span>
              <el-switch v-model="elementLocked" size="small" />
            </div>

            <div class="property-row">
              <span class="property-label">层级</span>
              <el-input-number
                v-model="elementZIndex"
                size="small"
                :step="1"
                controls-position="right"
              />
            </div>

            <div class="property-row">
              <span class="property-label">X</span>
              <el-input-number
                v-model="elementX"
                size="small"
                :min="0"
                :max="oledWidth - 1"
                controls-position="right"
              />
            </div>

            <div class="property-row">
              <span class="property-label">Y</span>
              <el-input-number
                v-model="elementY"
                size="small"
                :min="0"
                :max="oledHeight - 1"
                controls-position="right"
              />
            </div>

            <div class="property-row" v-if="selectedElement.type !== 'pixel'">
              <span class="property-label">宽度</span>
              <el-input-number
                v-model="elementWidth"
                size="small"
                :min="1"
                :max="oledWidth"
                controls-position="right"
              />
            </div>

            <div class="property-row" v-if="selectedElement.type !== 'pixel'">
              <span class="property-label">高度</span>
              <el-input-number
                v-model="elementHeight"
                size="small"
                :min="1"
                :max="oledHeight"
                controls-position="right"
              />
            </div>
          </div>

          <div class="property-group">
            <div class="group-title">样式</div>

            <div class="property-row">
              <span class="property-label">颜色</span>
              <el-radio-group v-model="elementColor" size="small">
                <el-radio-button :value="1">白</el-radio-button>
                <el-radio-button :value="0">黑</el-radio-button>
              </el-radio-group>
            </div>

            <div class="property-row" v-if="hasProperty('fill')">
              <span class="property-label">填充</span>
              <el-switch v-model="elementFill" size="small" />
            </div>

            <div class="property-row" v-if="hasProperty('strokeWidth')">
              <span class="property-label">描边</span>
              <el-input-number
                v-model="elementStrokeWidth"
                size="small"
                :min="1"
                :max="10"
                controls-position="right"
              />
            </div>

            <div class="property-row" v-if="hasProperty('radius')">
              <span class="property-label">圆角</span>
              <el-input-number
                v-model="elementRadius"
                size="small"
                :min="0"
                :max="50"
                controls-position="right"
              />
            </div>
          </div>

          <!-- Text Properties -->
          <div class="property-group" v-if="selectedElement.type === 'text'">
            <div class="group-title">文字</div>

            <div class="property-row">
              <span class="property-label">内容</span>
              <el-input
                v-model="elementText"
                size="small"
                placeholder="输入文字"
              />
            </div>

            <div class="property-row">
              <span class="property-label">字号</span>
              <el-select v-model="elementFontSize" size="small">
                <el-option :value="6" label="6x8" />
                <el-option :value="8" label="8x16" />
                <el-option :value="12" label="12x24" />
                <el-option :value="16" label="16x32" />
                <el-option :value="24" label="24x48" />
              </el-select>
            </div>

            <div class="property-row">
              <span class="property-label">对齐</span>
              <el-radio-group v-model="elementAlign" size="small">
                <el-radio-button value="left">左</el-radio-button>
                <el-radio-button value="center">中</el-radio-button>
                <el-radio-button value="right">右</el-radio-button>
              </el-radio-group>
            </div>
          </div>

          <!-- Image Properties -->
          <div class="property-group" v-if="selectedElement.type === 'image'">
            <div class="group-title">图片</div>

            <div class="property-row">
              <span class="property-label">阈值</span>
              <el-slider
                v-model="elementThreshold"
                :min="0"
                :max="255"
                size="small"
              />
            </div>

            <div class="property-row">
              <span class="property-label">抖动</span>
              <el-switch v-model="elementDithering" size="small" />
            </div>

            <el-button size="small" @click="reimportImage">重新导入</el-button>
          </div>

          <div class="property-group">
            <div class="group-title">操作</div>

            <div class="button-row">
              <el-button size="small" @click="bringToFront">
                <el-icon><Top /></el-icon>置顶
              </el-button>
              <el-button size="small" @click="sendToBack">
                <el-icon><Bottom /></el-icon>置底
              </el-button>
            </div>

            <div class="button-row">
              <el-button size="small" @click="duplicateElement">
                <el-icon><CopyDocument /></el-icon>复制
              </el-button>
              <el-button size="small" type="danger" @click="deleteElement">
                <el-icon><Delete /></el-icon>删除
              </el-button>
            </div>
          </div>
        </template>

        <!-- Multiple Elements Selected -->
        <template v-else>
          <div class="multi-selection">
            <el-icon><InfoFilled /></el-icon>
            <span>已选择 {{ selectedElements.length }} 个元素</span>
          </div>

          <div class="property-group">
            <div class="group-title">批量操作</div>

            <div class="button-row">
              <el-button size="small" type="danger" @click="deleteSelectedElements">
                <el-icon><Delete /></el-icon>删除全部
              </el-button>
            </div>
          </div>
        </template>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'
import type { ElementType } from '@/types'

const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

const oledWidth = computed(() => projectStore.config.oled.width)
const oledHeight = computed(() => projectStore.config.oled.height)
const currentPage = computed(() => projectStore.currentPage)

const selectedElements = computed(() =>
  projectStore.currentPage.elements.filter(el =>
    canvasStore.selectedElementIds.includes(el.id)
  )
)

const selectedElement = computed(() => selectedElements.value[0])

function getTypeName(type: ElementType): string {
  const names: Record<ElementType, string> = {
    pixel: '像素点',
    line: '直线',
    rect: '矩形',
    circle: '圆形',
    ellipse: '椭圆',
    roundRect: '圆角矩形',
    polygon: '多边形',
    text: '文字',
    image: '图片',
    progressBar: '进度条',
    icon: '图标'
  }
  return names[type] || type
}

function hasProperty(prop: string): boolean {
  if (!selectedElement.value) return false
  const type = selectedElement.value.type
  switch (prop) {
    case 'fill':
      return ['rect', 'circle', 'ellipse', 'roundRect'].includes(type)
    case 'radius':
      return type === 'roundRect'
    case 'strokeWidth':
      return ['line', 'rect', 'circle', 'ellipse', 'roundRect'].includes(type)
    default:
      return false
  }
}

// Property bindings
const pageName = computed({
  get: () => currentPage.value.name,
  set: (val: string) => {
    currentPage.value.name = val
    commitPageMeta()
  }
})

const pageBackground = computed({
  get: () => currentPage.value.backgroundColor,
  set: (val: 0 | 1) => {
    currentPage.value.backgroundColor = val
    commitPageMeta()
  }
})

const elementX = computed({
  get: () => selectedElement.value?.x || 0,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, { x: val })
    }
  }
})

const elementY = computed({
  get: () => selectedElement.value?.y || 0,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, { y: val })
    }
  }
})

const elementWidth = computed({
  get: () => selectedElement.value?.width || 1,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, { width: val })
    }
  }
})

const elementHeight = computed({
  get: () => selectedElement.value?.height || 1,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, { height: val })
    }
  }
})

const elementVisible = computed({
  get: () => selectedElement.value?.visible ?? true,
  set: (val: boolean) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, { visible: val })
    }
  }
})

const elementLocked = computed({
  get: () => selectedElement.value?.locked ?? false,
  set: (val: boolean) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, { locked: val })
    }
  }
})

const elementZIndex = computed({
  get: () => selectedElement.value?.zIndex ?? 0,
  set: (val: number) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, { zIndex: val })
    }
  }
})

const elementColor = computed({
  get: () => selectedElement.value?.properties.color ?? 1,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, color: val }
      })
    }
  }
})

const elementFill = computed({
  get: () => selectedElement.value?.properties.fill || false,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, fill: val }
      })
    }
  }
})

const elementStrokeWidth = computed({
  get: () => selectedElement.value?.properties.strokeWidth || 1,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, strokeWidth: val }
      })
    }
  }
})

const elementRadius = computed({
  get: () => selectedElement.value?.properties.radius || 4,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, radius: val }
      })
    }
  }
})

const elementText = computed({
  get: () => selectedElement.value?.properties.text || '',
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, text: val }
      })
    }
  }
})

const elementFontSize = computed({
  get: () => selectedElement.value?.properties.fontSize || 8,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, fontSize: val }
      })
    }
  }
})

const elementAlign = computed({
  get: () => selectedElement.value?.properties.align || 'left',
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, align: val }
      })
    }
  }
})

const elementThreshold = computed({
  get: () => selectedElement.value?.properties.threshold || 128,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, threshold: val }
      })
    }
  }
})

const elementDithering = computed({
  get: () => selectedElement.value?.properties.dithering || false,
  set: (val) => {
    if (selectedElement.value) {
      projectStore.updateElement(selectedElement.value.id, {
        properties: { ...selectedElement.value.properties, dithering: val }
      })
    }
  }
})

function commitPageMeta() {
  projectStore.saveToHistory()
}

function commitPageLinks() {
  projectStore.saveToHistory()
}

function addPageLink() {
  const fallbackTarget =
    projectStore.pages.find(p => p.id !== currentPage.value.id)?.id || currentPage.value.id
  currentPage.value.links.push({
    id: uuidv4(),
    trigger: 'KEY_OK',
    targetPageId: fallbackTarget,
    transition: 'NONE',
    timerMs: 500,
    condition: ''
  })
  commitPageLinks()
}

function removePageLink(index: number) {
  currentPage.value.links.splice(index, 1)
  commitPageLinks()
}

function bringToFront() {
  if (selectedElement.value) {
    projectStore.bringToFront(selectedElement.value.id)
  }
}

function sendToBack() {
  if (selectedElement.value) {
    projectStore.sendToBack(selectedElement.value.id)
  }
}

function duplicateElement() {
  if (selectedElement.value) {
    const el = selectedElement.value
    projectStore.addElement({
      ...el,
      x: el.x + 5,
      y: el.y + 5,
      properties: { ...el.properties }
    })
  }
}

function deleteElement() {
  if (selectedElement.value) {
    projectStore.deleteElement(selectedElement.value.id)
    canvasStore.clearSelection()
  }
}

function deleteSelectedElements() {
  projectStore.deleteSelectedElements(canvasStore.selectedElementIds)
  canvasStore.clearSelection()
}

async function reimportImage() {
  const result = await window.electronAPI.importImage()
  if (result.success && result.dataUrl && selectedElement.value) {
    projectStore.updateElement(selectedElement.value.id, {
      properties: { ...selectedElement.value.properties, imageData: result.dataUrl }
    })
  }
}
</script>

<style scoped>
.property-panel {
  width: 240px;
  background-color: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid var(--border-color);
}

.panel-content {
  padding: 12px;
}

.no-selection,
.multi-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: var(--text-muted);
  text-align: center;
}

.property-group {
  margin-bottom: 16px;
}

.group-title {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.property-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.property-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.property-value {
  font-size: 12px;
  color: var(--text-primary);
}

.button-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.button-row .el-button {
  flex: 1;
}

.link-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.property-label.muted {
  color: var(--text-muted);
}
</style>
