import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ToolType } from '@/types'

export const useToolStore = defineStore('tool', () => {
  const currentTool = ref<ToolType>('select')
  const toolOptions = ref({
    color: 1 as 0 | 1,
    fill: false,
    strokeWidth: 1,
    fontSize: 8 as 6 | 8 | 12 | 16 | 24,
    fontFamily: 'default',
    textAlign: 'left' as 'left' | 'center' | 'right',
    cornerRadius: 4,
    threshold: 128,
    dithering: false,
    stripThickness: 6
  })

  function setTool(tool: ToolType) {
    currentTool.value = tool
  }

  function setOption<K extends keyof typeof toolOptions.value>(
    key: K,
    value: typeof toolOptions.value[K]
  ) {
    toolOptions.value[key] = value
  }

  function toggleColor() {
    toolOptions.value.color = toolOptions.value.color === 1 ? 0 : 1
  }

  function toggleFill() {
    toolOptions.value.fill = !toolOptions.value.fill
  }

  return {
    currentTool,
    toolOptions,
    setTool,
    setOption,
    toggleColor,
    toggleFill
  }
})
