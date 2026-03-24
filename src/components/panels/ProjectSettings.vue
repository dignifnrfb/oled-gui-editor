<template>
  <div class="project-settings">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="OLED 配置" name="oled">
        <el-form label-width="100px" size="small">
          <el-form-item label="项目名称">
            <el-input v-model="config.name" />
          </el-form-item>

          <el-form-item label="作者">
            <el-input v-model="config.author" />
          </el-form-item>

          <el-divider />

          <el-form-item label="屏幕宽度">
            <el-input-number v-model="config.oled.width" :min="16" :max="256" />
          </el-form-item>

          <el-form-item label="屏幕高度">
            <el-input-number v-model="config.oled.height" :min="16" :max="128" />
          </el-form-item>

          <el-form-item label="常用分辨率">
            <el-button-group>
              <el-button @click="setResolution(128, 64)">128x64</el-button>
              <el-button @click="setResolution(128, 32)">128x32</el-button>
              <el-button @click="setResolution(132, 64)">132x64</el-button>
              <el-button @click="setResolution(96, 16)">96x16</el-button>
            </el-button-group>
          </el-form-item>

          <el-form-item label="驱动芯片">
            <el-select v-model="config.oled.driver">
              <el-option value="SSD1306" label="SSD1306" />
              <el-option value="SSD1309" label="SSD1309" />
              <el-option value="SH1106" label="SH1106" />
            </el-select>
          </el-form-item>

          <el-form-item label="通信总线">
            <el-select v-model="config.oled.bus">
              <el-option value="I2C" label="I2C" />
              <el-option value="SPI_4WIRE" label="SPI (4-Wire)" />
              <el-option value="SPI_3WIRE" label="SPI (3-Wire)" />
            </el-select>
          </el-form-item>

          <el-form-item label="I2C 地址" v-if="config.oled.bus === 'I2C'">
            <el-select v-model="config.oled.i2cAddress">
              <el-option :value="0x3c" label="0x3C" />
              <el-option :value="0x3d" label="0x3D" />
            </el-select>
          </el-form-item>

          <el-form-item label="屏幕旋转">
            <el-select v-model="config.oled.rotation">
              <el-option :value="0" label="0°" />
              <el-option :value="90" label="90°" />
              <el-option :value="180" label="180°" />
              <el-option :value="270" label="270°" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="MCU 配置" name="mcu">
        <el-form label-width="100px" size="small">
          <el-form-item label="MCU 平台">
            <el-select v-model="config.mcu.platform">
              <el-option value="STM32F1" label="STM32F1 系列" />
              <el-option value="STM32F4" label="STM32F4 系列" />
              <el-option value="STM32H7" label="STM32H7 系列" />
              <el-option value="GENERIC" label="通用 (平台无关)" />
            </el-select>
          </el-form-item>

          <el-form-item label="代码风格">
            <el-select v-model="config.mcu.codeStyle">
              <el-option value="HAL" label="HAL 库" />
              <el-option value="STDPERIPH" label="标准外设库" />
              <el-option value="BARE" label="寄存器" />
            </el-select>
          </el-form-item>

          <el-divider content-position="left">引脚配置</el-divider>

          <template v-if="config.oled.bus === 'I2C'">
            <el-form-item label="SDA">
              <el-input v-model="config.mcu.pins.sda" placeholder="例如: PB7" />
            </el-form-item>
            <el-form-item label="SCL">
              <el-input v-model="config.mcu.pins.scl" placeholder="例如: PB6" />
            </el-form-item>
          </template>

          <template v-else>
            <el-form-item label="MOSI">
              <el-input v-model="config.mcu.pins.mosi" placeholder="例如: PA7" />
            </el-form-item>
            <el-form-item label="SCLK">
              <el-input v-model="config.mcu.pins.sclk" placeholder="例如: PA5" />
            </el-form-item>
            <el-form-item label="CS">
              <el-input v-model="config.mcu.pins.cs" placeholder="例如: PA4" />
            </el-form-item>
            <el-form-item label="DC">
              <el-input v-model="config.mcu.pins.dc" placeholder="例如: PA3" />
            </el-form-item>
          </template>

          <el-form-item label="RESET">
            <el-input v-model="config.mcu.pins.reset" placeholder="例如: PA2" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="代码生成" name="codegen">
        <el-form label-width="100px" size="small">
          <el-form-item label="包含注释">
            <el-switch v-model="config.codeGen.includeComments" />
          </el-form-item>

          <el-form-item label="使用 const">
            <el-switch v-model="config.codeGen.useConst" />
          </el-form-item>

          <el-form-item label="取模格式">
            <el-select v-model="config.codeGen.arrayFormat">
              <el-option value="COLUMN" label="逐列取模 (SSD1306)" />
              <el-option value="ROW" label="逐行取模" />
            </el-select>
          </el-form-item>

          <el-form-item label="位序">
            <el-select v-model="config.codeGen.bitOrder">
              <el-option value="LSB" label="LSB (低位在前)" />
              <el-option value="MSB" label="MSB (高位在前)" />
            </el-select>
          </el-form-item>

      <el-form-item label="压缩">
        <el-select v-model="config.codeGen.compression">
          <el-option value="NONE" label="无压缩" />
          <el-option value="RLE" label="RLE 压缩" />
        </el-select>
      </el-form-item>
    </el-form>
  </el-tab-pane>

    <el-tab-pane label="运行/预览" name="runtime">
      <el-form label-width="120px" size="small">
        <el-form-item label="预览帧率 (FPS)">
          <el-input-number v-model="config.runtime.frameRate" :min="1" :max="120" :step="1" />
        </el-form-item>
        <div class="tip">帧率越高越流畅，越低越省性能。</div>
      </el-form>
    </el-tab-pane>
  </el-tabs>
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '@/stores/project'

const projectStore = useProjectStore()

const activeTab = ref('oled')

const config = computed(() => projectStore.config)

function setResolution(width: number, height: number) {
  projectStore.updateConfig({
    oled: {
      ...config.value.oled,
      width,
      height
    }
  })
}
</script>

<style scoped>
.project-settings {
  padding: 8px;
}

.el-form-item {
  margin-bottom: 12px;
}

.tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
