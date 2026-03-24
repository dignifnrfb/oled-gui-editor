<template>
  <div class="ruler-container">
    <!-- Horizontal ruler (top) -->
    <div class="ruler horizontal" :style="{ left: cornerSize + 'px' }">
      <canvas
        ref="hRulerCanvas"
        :width="canvasWidth"
        :height="rulerSize"
        class="ruler-canvas"
      ></canvas>
    </div>

    <!-- Vertical ruler (left) -->
    <div class="ruler vertical" :style="{ top: cornerSize + 'px' }">
      <canvas
        ref="vRulerCanvas"
        :width="rulerSize"
        :height="canvasHeight"
        class="ruler-canvas"
      ></canvas>
    </div>

    <!-- Corner (origin indicator) -->
    <div class="ruler-corner" :style="{ width: cornerSize + 'px', height: cornerSize + 'px' }">
      <span class="origin-label">0</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useProjectStore } from '@/stores/project'
import { useCanvasStore } from '@/stores/canvas'

const props = defineProps<{
  mouseX?: number
  mouseY?: number
}>()

const projectStore = useProjectStore()
const canvasStore = useCanvasStore()

const hRulerCanvas = ref<HTMLCanvasElement>()
const vRulerCanvas = ref<HTMLCanvasElement>()

const rulerSize = 20
const cornerSize = 20

const oledWidth = computed(() => projectStore.config.oled.width)
const oledHeight = computed(() => projectStore.config.oled.height)
const scale = computed(() => canvasStore.scale)

const canvasWidth = computed(() => oledWidth.value * scale.value)
const canvasHeight = computed(() => oledHeight.value * scale.value)

function renderHorizontalRuler() {
  const canvas = hRulerCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Clear
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(0, 0, width, height)

  // Draw ticks and labels
  ctx.fillStyle = '#888'
  ctx.strokeStyle = '#555'
  ctx.font = '9px monospace'
  ctx.textAlign = 'center'

  const pixelWidth = scale.value
  const majorInterval = getMajorInterval(pixelWidth)

  for (let i = 0; i <= oledWidth.value; i++) {
    const x = i * pixelWidth

    if (i % majorInterval === 0) {
      // Major tick
      ctx.beginPath()
      ctx.moveTo(x, height - 10)
      ctx.lineTo(x, height)
      ctx.stroke()

      // Label
      ctx.fillText(String(i), x, height - 12)
    } else if (i % (majorInterval / 2) === 0 && majorInterval >= 10) {
      // Medium tick
      ctx.beginPath()
      ctx.moveTo(x, height - 6)
      ctx.lineTo(x, height)
      ctx.stroke()
    } else if (pixelWidth >= 4) {
      // Minor tick (only when zoomed in)
      ctx.beginPath()
      ctx.moveTo(x, height - 3)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }

  // Draw mouse position indicator
  if (props.mouseX !== undefined && props.mouseX >= 0 && props.mouseX < oledWidth.value) {
    const x = props.mouseX * pixelWidth
    ctx.fillStyle = '#ff6b6b'
    ctx.beginPath()
    ctx.moveTo(x, height)
    ctx.lineTo(x - 4, height - 8)
    ctx.lineTo(x + 4, height - 8)
    ctx.closePath()
    ctx.fill()
  }
}

function renderVerticalRuler() {
  const canvas = vRulerCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Clear
  ctx.fillStyle = '#2a2a2a'
  ctx.fillRect(0, 0, width, height)

  // Draw ticks and labels
  ctx.fillStyle = '#888'
  ctx.strokeStyle = '#555'
  ctx.font = '9px monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  const pixelHeight = scale.value
  const majorInterval = getMajorInterval(pixelHeight)

  for (let i = 0; i <= oledHeight.value; i++) {
    const y = i * pixelHeight

    if (i % majorInterval === 0) {
      // Major tick
      ctx.beginPath()
      ctx.moveTo(width - 10, y)
      ctx.lineTo(width, y)
      ctx.stroke()

      // Label (rotated)
      ctx.save()
      ctx.translate(width - 12, y)
      ctx.fillText(String(i), 0, 0)
      ctx.restore()
    } else if (i % (majorInterval / 2) === 0 && majorInterval >= 10) {
      // Medium tick
      ctx.beginPath()
      ctx.moveTo(width - 6, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    } else if (pixelHeight >= 4) {
      // Minor tick
      ctx.beginPath()
      ctx.moveTo(width - 3, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  // Draw mouse position indicator
  if (props.mouseY !== undefined && props.mouseY >= 0 && props.mouseY < oledHeight.value) {
    const y = props.mouseY * pixelHeight
    ctx.fillStyle = '#ff6b6b'
    ctx.beginPath()
    ctx.moveTo(width, y)
    ctx.lineTo(width - 8, y - 4)
    ctx.lineTo(width - 8, y + 4)
    ctx.closePath()
    ctx.fill()
  }
}

function getMajorInterval(pixelSize: number): number {
  if (pixelSize >= 8) return 5
  if (pixelSize >= 4) return 10
  if (pixelSize >= 2) return 20
  return 50
}

function render() {
  renderHorizontalRuler()
  renderVerticalRuler()
}

watch([scale, oledWidth, oledHeight], () => {
  nextTick(render)
})

watch(() => [props.mouseX, props.mouseY], () => {
  render()
})

onMounted(() => {
  render()
})

defineExpose({ render })
</script>

<style scoped>
.ruler-container {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 100;
}

.ruler {
  position: absolute;
  background-color: #2a2a2a;
  border: 1px solid #333;
}

.ruler.horizontal {
  top: 0;
  height: 20px;
}

.ruler.vertical {
  left: 0;
  width: 20px;
}

.ruler-canvas {
  display: block;
}

.ruler-corner {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #2a2a2a;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.origin-label {
  font-size: 9px;
  color: #666;
}
</style>
