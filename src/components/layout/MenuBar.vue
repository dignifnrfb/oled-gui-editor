<template>
  <div class="menu-bar">
    <div class="menu-left">
      <el-dropdown trigger="click" @command="handleFileCommand">
        <span class="menu-item">文件</span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="new">
              <el-icon><Document /></el-icon>新建项目
            </el-dropdown-item>
            <el-dropdown-item command="open">
              <el-icon><FolderOpened /></el-icon>打开项目
            </el-dropdown-item>
            <el-dropdown-item command="save">
              <el-icon><DocumentChecked /></el-icon>保存
            </el-dropdown-item>
            <el-dropdown-item command="saveAs">
              <el-icon><DocumentCopy /></el-icon>另存为
            </el-dropdown-item>
            <el-dropdown-item divided command="export">
              <el-icon><Download /></el-icon>导出代码
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" @command="handleEditCommand">
        <span class="menu-item">编辑</span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="undo" :disabled="!canUndo">
              <el-icon><RefreshLeft /></el-icon>撤销
            </el-dropdown-item>
            <el-dropdown-item command="redo" :disabled="!canRedo">
              <el-icon><RefreshRight /></el-icon>重做
            </el-dropdown-item>
            <el-dropdown-item divided command="copy">
              <el-icon><CopyDocument /></el-icon>复制
            </el-dropdown-item>
            <el-dropdown-item command="paste">
              <el-icon><DocumentAdd /></el-icon>粘贴
            </el-dropdown-item>
            <el-dropdown-item command="delete">
              <el-icon><Delete /></el-icon>删除
            </el-dropdown-item>
            <el-dropdown-item divided command="selectAll">
              <el-icon><Select /></el-icon>全选
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" @command="handleViewCommand">
        <span class="menu-item">视图</span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zoomIn">
              <el-icon><ZoomIn /></el-icon>放大
            </el-dropdown-item>
            <el-dropdown-item command="zoomOut">
              <el-icon><ZoomOut /></el-icon>缩小
            </el-dropdown-item>
            <el-dropdown-item command="resetView">
              <el-icon><Refresh /></el-icon>重置视图
            </el-dropdown-item>
            <el-dropdown-item divided command="toggleGrid">
              <el-icon><Grid /></el-icon>{{ showGrid ? '隐藏网格' : '显示网格' }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <span class="menu-item" @click="showSettings = true">设置</span>
      <span class="menu-item" @click="showHelp = true">帮助</span>
    </div>

    <div class="menu-center">
      <span class="project-name">{{ projectStore.config.name }}</span>
      <span v-if="projectStore.isDirty" class="dirty-indicator">●</span>
    </div>

    <div class="menu-right">
      <el-button size="small" type="primary" @click="handleExport">
        <el-icon><Download /></el-icon>导出代码
      </el-button>
    </div>

    <!-- Settings Dialog -->
    <el-dialog v-model="showSettings" title="项目设置" width="600px">
      <ProjectSettings />
    </el-dialog>

    <!-- Help Dialog -->
    <el-dialog v-model="showHelp" title="帮助" width="500px">
      <div class="help-content">
        <h3>OLED GUI Editor</h3>
        <p>可视化 OLED 界面编辑器，支持生成 STM32 可用的 C 代码。</p>
        <h4>快捷键</h4>
        <ul>
          <li><kbd>Ctrl+N</kbd> 新建项目</li>
          <li><kbd>Ctrl+O</kbd> 打开项目</li>
          <li><kbd>Ctrl+S</kbd> 保存项目</li>
          <li><kbd>Ctrl+Z</kbd> 撤销</li>
          <li><kbd>Ctrl+Y</kbd> 重做</li>
          <li><kbd>Delete</kbd> 删除选中</li>
          <li><kbd>Ctrl+C</kbd> 复制</li>
          <li><kbd>Ctrl+V</kbd> 粘贴</li>
        </ul>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'
import { generateCode } from '@/codegen/generator'
import ProjectSettings from '../panels/ProjectSettings.vue'

const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

const showSettings = ref(false)
const showHelp = ref(false)

const canUndo = computed(() => projectStore.canUndo())
const canRedo = computed(() => projectStore.canRedo())
const showGrid = computed(() => canvasStore.showGrid)

async function handleFileCommand(command: string) {
  switch (command) {
    case 'new':
      await handleNew()
      break
    case 'open':
      await handleOpen()
      break
    case 'save':
      await handleSave()
      break
    case 'saveAs':
      await handleSaveAs()
      break
    case 'export':
      await handleExport()
      break
  }
}

function handleEditCommand(command: string) {
  switch (command) {
    case 'undo':
      projectStore.undo()
      break
    case 'redo':
      projectStore.redo()
      break
    case 'copy':
      handleCopy()
      break
    case 'paste':
      handlePaste()
      break
    case 'delete':
      handleDelete()
      break
    case 'selectAll':
      handleSelectAll()
      break
  }
}

function handleViewCommand(command: string) {
  switch (command) {
    case 'zoomIn':
      canvasStore.zoomIn()
      break
    case 'zoomOut':
      canvasStore.zoomOut()
      break
    case 'resetView':
      canvasStore.resetView()
      break
    case 'toggleGrid':
      canvasStore.toggleGrid()
      break
  }
}

async function handleNew() {
  if (projectStore.isDirty) {
    try {
      await ElMessageBox.confirm('当前项目有未保存的更改，是否保存？', '提示', {
        confirmButtonText: '保存',
        cancelButtonText: '不保存',
        distinguishCancelAndClose: true
      })
      await handleSave()
    } catch (action) {
      if (action === 'close') return
    }
  }
  projectStore.newProject()
  ElMessage.success('已创建新项目')
}

async function handleOpen() {
  const result = await window.electronAPI.openProject()
  if (result.success && result.data) {
    try {
      const project = JSON.parse(result.data)
      project.filePath = result.filePath
      projectStore.loadProject(project)
      ElMessage.success('项目已打开')
    } catch {
      ElMessage.error('无法解析项目文件')
    }
  }
}

async function handleSave() {
  const data = JSON.stringify(projectStore.getProjectData(), null, 2)
  const result = await window.electronAPI.saveProject(data, projectStore.filePath)
  if (result.success && result.filePath) {
    projectStore.setFilePath(result.filePath)
    ElMessage.success('项目已保存')
  }
}

async function handleSaveAs() {
  const data = JSON.stringify(projectStore.getProjectData(), null, 2)
  const result = await window.electronAPI.saveProject(data)
  if (result.success && result.filePath) {
    projectStore.setFilePath(result.filePath)
    ElMessage.success('项目已保存')
  }
}

async function handleExport() {
  const projectJson = JSON.stringify(projectStore.getProjectData(), null, 2)
  const safeName = (projectStore.config.name || 'project').replace(/[^a-zA-Z0-9_-]/g, '_') || 'project'
  const files = [
    { name: `${safeName}.oled`, content: projectJson },
    ...generateCode(projectStore.getProjectData())
  ]
  const result = await window.electronAPI.exportCode(files)
  if (result.success) {
    ElMessage.success(`代码已导出到: ${result.exportDir}`)
  }
}

function handleCopy() {
  const elements = projectStore.currentPage.elements.filter(el =>
    canvasStore.selectedElementIds.includes(el.id)
  )
  canvasStore.setClipboard(elements)
  if (elements.length > 0) {
    ElMessage.success(`已复制 ${elements.length} 个元素`)
  }
}

function handlePaste() {
  if (canvasStore.clipboard.length > 0) {
    canvasStore.clipboard.forEach(el => {
      projectStore.addElement({
        ...el,
        x: el.x + 5,
        y: el.y + 5
      })
    })
    ElMessage.success(`已粘贴 ${canvasStore.clipboard.length} 个元素`)
  }
}

function handleDelete() {
  if (canvasStore.selectedElementIds.length > 0) {
    projectStore.deleteSelectedElements(canvasStore.selectedElementIds)
    canvasStore.clearSelection()
    ElMessage.success('已删除选中元素')
  }
}

function handleSelectAll() {
  const allIds = projectStore.currentPage.elements.map(el => el.id)
  canvasStore.selectElements(allIds)
}

// Keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault()
        handleNew()
        break
      case 'o':
        e.preventDefault()
        handleOpen()
        break
      case 's':
        e.preventDefault()
        if (e.shiftKey) {
          handleSaveAs()
        } else {
          handleSave()
        }
        break
      case 'z':
        e.preventDefault()
        projectStore.undo()
        break
      case 'y':
        e.preventDefault()
        projectStore.redo()
        break
      case 'c':
        e.preventDefault()
        handleCopy()
        break
      case 'v':
        e.preventDefault()
        handlePaste()
        break
      case 'a':
        e.preventDefault()
        handleSelectAll()
        break
    }
  } else if (e.key === 'Delete') {
    handleDelete()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.menu-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 12px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  -webkit-app-region: drag;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 4px;
  -webkit-app-region: no-drag;
}

.menu-item {
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.menu-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.menu-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-name {
  font-size: 13px;
  color: var(--text-secondary);
}

.dirty-indicator {
  color: var(--accent-color);
  font-size: 10px;
}

.menu-right {
  -webkit-app-region: no-drag;
}

.help-content {
  line-height: 1.8;
}

.help-content h3 {
  margin-bottom: 12px;
}

.help-content h4 {
  margin: 16px 0 8px;
}

.help-content ul {
  padding-left: 20px;
}

.help-content kbd {
  padding: 2px 6px;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}
</style>
