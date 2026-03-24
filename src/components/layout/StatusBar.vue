<template>
  <div class="status-bar">
    <div class="status-left">
      <span class="status-item">
        <el-icon><Monitor /></el-icon>
        {{ oledWidth }}x{{ oledHeight }}
      </span>
      <span class="status-item">
        <el-icon><Cpu /></el-icon>
        {{ config.oled.driver }}
      </span>
      <span class="status-item">
        <el-icon><Connection /></el-icon>
        {{ config.oled.bus }}
      </span>
    </div>

    <div class="status-center">
      <span class="status-item" v-if="selectedCount > 0">
        已选择 {{ selectedCount }} 个元素
      </span>
      <span class="status-item" v-else>
        当前页面: {{ currentPage.name }} ({{ elementCount }} 个元素)
      </span>
    </div>

    <div class="status-right">
      <el-tooltip content="Ctrl+Z 撤销 | Ctrl+Y 重做 | Ctrl+S 保存" placement="top">
        <span class="status-item shortcut-hint">
          <el-icon><Keyboard /></el-icon>
          快捷键
        </span>
      </el-tooltip>
      <span class="status-item">
        缩放 {{ Math.round(scale * 100) }}%
      </span>
      <span class="status-item" :class="{ 'unsaved': isDirty }">
        <el-icon v-if="isDirty"><Warning /></el-icon>
        <el-icon v-else><CircleCheck /></el-icon>
        {{ isDirty ? '未保存' : '已保存' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'

const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

const config = computed(() => projectStore.config)
const oledWidth = computed(() => projectStore.config.oled.width)
const oledHeight = computed(() => projectStore.config.oled.height)
const currentPage = computed(() => projectStore.currentPage)
const elementCount = computed(() => projectStore.currentPage.elements.length)
const selectedCount = computed(() => canvasStore.selectedElementIds.length)
const scale = computed(() => canvasStore.scale)
const isDirty = computed(() => projectStore.isDirty)
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  padding: 0 12px;
  background-color: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  font-size: 11px;
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-muted);
}

.status-item .el-icon {
  font-size: 12px;
}

.status-item.shortcut-hint {
  cursor: help;
  opacity: 0.7;
}

.status-item.shortcut-hint:hover {
  opacity: 1;
}

.status-item.unsaved {
  color: #e6a23c;
}
</style>
