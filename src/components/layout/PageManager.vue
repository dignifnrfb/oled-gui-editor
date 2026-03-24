<template>
  <div class="page-manager">
    <div class="page-header">
      <span class="title">页面</span>
      <div class="header-actions">
        <el-button size="small" text @click="addPage">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
    </div>

    <el-scrollbar>
      <div class="page-list">
        <div
          v-for="(page, index) in pages"
          :key="page.id"
          class="page-item"
          :class="{ active: page.id === currentPageId }"
          @click="selectPage(page.id)"
          @dblclick="renamePage(page)"
          @contextmenu.prevent="showContextMenu($event, page)"
        >
          <div class="page-preview">
            <canvas
              :ref="el => setCanvasRef(el, page.id)"
              :width="previewWidth"
              :height="previewHeight"
            ></canvas>
          </div>
          <div class="page-info">
            <span class="page-name">{{ page.name }}</span>
            <span class="page-index">{{ index + 1 }}/{{ pages.length }}</span>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="handleContextAction('rename')">
        <el-icon><Edit /></el-icon>重命名
      </div>
      <div class="menu-item" @click="handleContextAction('duplicate')">
        <el-icon><CopyDocument /></el-icon>复制页面
      </div>
      <div class="menu-item" @click="handleContextAction('link')">
        <el-icon><Link /></el-icon>页面链接
      </div>
      <div class="menu-divider"></div>
      <div
        class="menu-item danger"
        :class="{ disabled: pages.length <= 1 }"
        @click="handleContextAction('delete')"
      >
        <el-icon><Delete /></el-icon>删除页面
      </div>
    </div>

    <!-- Page Link Dialog -->
    <el-dialog v-model="linkDialogVisible" title="页面链接" width="500px">
      <div class="link-form" v-if="contextMenu.page">
        <div class="link-item" v-for="(link, idx) in contextMenu.page.links" :key="link.id">
          <el-select v-model="link.trigger" placeholder="触发方式" size="small">
            <el-option value="KEY_UP" label="按键-上" />
            <el-option value="KEY_DOWN" label="按键-下" />
            <el-option value="KEY_LEFT" label="按键-左" />
            <el-option value="KEY_RIGHT" label="按键-右" />
            <el-option value="KEY_OK" label="按键-确认" />
            <el-option value="KEY_BACK" label="按键-返回" />
            <el-option value="TIMER" label="定时器" />
            <el-option value="CONDITION" label="条件表达式" />
          </el-select>

          <el-select v-model="link.targetPageId" placeholder="目标页面" size="small">
            <el-option
              v-for="p in pages"
              :key="p.id"
              :value="p.id"
              :label="p.name"
              :disabled="p.id === contextMenu.page?.id"
            />
          </el-select>

          <el-input-number
            v-if="link.trigger === 'TIMER'"
            v-model="link.timerMs"
            :min="100"
            :max="60000"
            size="small"
            placeholder="毫秒"
          />

          <el-input
            v-if="link.trigger === 'CONDITION'"
            v-model="link.condition"
            size="small"
            placeholder="C 条件表达式"
          />

          <el-button size="small" text type="danger" @click="removeLink(idx)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>

        <el-button size="small" @click="addLink">
          <el-icon><Plus /></el-icon>添加链接
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import type { Page, PageLink } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { drawElement } from '@/utils/drawingUtils'

const projectStore = useProjectStore()

const pages = computed(() => projectStore.pages)
const currentPageId = computed(() => projectStore.currentPageId)

const previewWidth = 64
const previewHeight = 32

const canvasRefs = ref<Record<string, HTMLCanvasElement | null>>({})
const linkDialogVisible = ref(false)

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  page: null as Page | null
})

function setCanvasRef(el: any, pageId: string) {
  if (el) {
    canvasRefs.value[pageId] = el as HTMLCanvasElement
    renderPagePreview(pageId)
  }
}

function renderPagePreview(pageId: string) {
  const canvas = canvasRefs.value[pageId]
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const page = pages.value.find(p => p.id === pageId)
  if (!page) return

  const oledWidth = projectStore.config.oled.width
  const oledHeight = projectStore.config.oled.height

  // Clear canvas
  ctx.fillStyle = page.backgroundColor === 1 ? '#00ff00' : '#1a1a1a'
  ctx.fillRect(0, 0, previewWidth, previewHeight)

  // Scale factor
  const scaleX = previewWidth / oledWidth
  const scaleY = previewHeight / oledHeight
  ctx.scale(scaleX, scaleY)

  // Draw elements
  const sortedElements = [...page.elements].sort((a, b) => a.zIndex - b.zIndex)
  for (const element of sortedElements) {
    if (element.visible) {
      drawElement(ctx, element)
    }
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

function selectPage(pageId: string) {
  projectStore.setCurrentPage(pageId)
  hideContextMenu()
}

function addPage() {
  projectStore.addPage()
  nextTick(() => {
    renderAllPreviews()
  })
}

async function renamePage(page: Page) {
  const { value } = await ElMessageBox.prompt('请输入页面名称', '重命名', {
    inputValue: page.name,
    inputPattern: /\S+/,
    inputErrorMessage: '名称不能为空'
  })
  if (value) {
    const pageIndex = pages.value.findIndex(p => p.id === page.id)
    if (pageIndex !== -1) {
      projectStore.pages[pageIndex].name = value
      projectStore.saveToHistory()
    }
  }
}

function showContextMenu(event: MouseEvent, page: Page) {
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    page
  }
}

function hideContextMenu() {
  contextMenu.value.visible = false
}

function handleContextAction(action: string) {
  const page = contextMenu.value.page
  if (!page) return

  switch (action) {
    case 'rename':
      renamePage(page)
      break
    case 'duplicate':
      projectStore.duplicatePage(page.id)
      nextTick(renderAllPreviews)
      break
    case 'delete':
      if (pages.value.length > 1) {
        projectStore.deletePage(page.id)
        nextTick(renderAllPreviews)
      }
      break
    case 'link':
      linkDialogVisible.value = true
      break
  }

  hideContextMenu()
}

function addLink() {
  if (!contextMenu.value.page) return
  const newLink: PageLink = {
    id: uuidv4(),
    trigger: 'KEY_OK',
    targetPageId: pages.value[0]?.id || '',
    transition: 'NONE'
  }
  contextMenu.value.page.links.push(newLink)
}

function removeLink(index: number) {
  if (!contextMenu.value.page) return
  contextMenu.value.page.links.splice(index, 1)
}

function renderAllPreviews() {
  for (const page of pages.value) {
    renderPagePreview(page.id)
  }
}

// Watch for changes
watch(() => projectStore.currentPage, () => {
  nextTick(renderAllPreviews)
}, { deep: true })

// Close context menu on click outside
function handleClickOutside() {
  if (contextMenu.value.visible) {
    hideContextMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  nextTick(renderAllPreviews)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.page-manager {
  height: 140px;
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
}

.title {
  font-size: 12px;
  color: var(--text-secondary);
}

.page-list {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.page-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.page-item:hover {
  background-color: var(--bg-hover);
}

.page-item.active {
  border-color: var(--accent-color);
  background-color: rgba(0, 120, 212, 0.1);
}

.page-preview {
  width: 64px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  background-color: #000;
}

.page-preview canvas {
  image-rendering: pixelated;
}

.page-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-name {
  font-size: 11px;
  color: var(--text-primary);
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-index {
  font-size: 10px;
  color: var(--text-muted);
}

.context-menu {
  position: fixed;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 0;
  min-width: 150px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
}

.menu-item:hover {
  background-color: var(--bg-hover);
}

.menu-item.danger {
  color: var(--error-color);
}

.menu-item.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.menu-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 4px 0;
}

.link-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.link-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.link-item .el-select {
  flex: 1;
}
</style>
