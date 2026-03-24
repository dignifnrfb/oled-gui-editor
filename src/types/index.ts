// Type definitions for OLED GUI Editor

export interface ProjectConfig {
  name: string
  author: string
  version: string
  oled: OLEDConfig
  mcu: MCUConfig
  codeGen: CodeGenConfig
  runtime: RuntimeConfig
}

export interface OLEDConfig {
  width: number
  height: number
  driver: 'SSD1306' | 'SSD1309' | 'SH1106'
  bus: 'I2C' | 'SPI_4WIRE' | 'SPI_3WIRE'
  i2cAddress: number
  rotation: 0 | 90 | 180 | 270
}

export interface MCUConfig {
  platform: 'STM32F1' | 'STM32F4' | 'STM32H7' | 'GENERIC'
  codeStyle: 'HAL' | 'STDPERIPH' | 'BARE'
  pins: PinConfig
}

export interface PinConfig {
  sda?: string
  scl?: string
  mosi?: string
  sclk?: string
  cs?: string
  dc?: string
  reset?: string
}

export interface CodeGenConfig {
  includeComments: boolean
  useConst: boolean
  arrayFormat: 'ROW' | 'COLUMN'
  bitOrder: 'MSB' | 'LSB'
  compression: 'NONE' | 'RLE'
}

export interface RuntimeConfig {
  frameRate: number
}

export interface Page {
  id: string
  name: string
  elements: Element[]
  links: PageLink[]
  backgroundColor: 0 | 1
}

export interface Element {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  locked: boolean
  zIndex: number
  properties: ElementProperties
}

export type ElementType =
  | 'pixel'
  | 'line'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'roundRect'
  | 'polygon'
  | 'text'
  | 'image'
  | 'progressBar'
  | 'icon'

export interface ElementProperties {
  // Common
  color?: 0 | 1
  // Line
  x2?: number
  y2?: number
  // Shape
  fill?: boolean
  strokeWidth?: number
  // RoundRect
  radius?: number
  // Text
  text?: string
  fontSize?: 6 | 8 | 12 | 16 | 24
  fontFamily?: string
  align?: 'left' | 'center' | 'right'
  // Image
  imageData?: string
  threshold?: number
  dithering?: boolean
  processedData?: number[]  // Pre-processed byte array for export
  // ProgressBar
  value?: number
  maxValue?: number
  showPercent?: boolean
  // Polygon
  points?: { x: number; y: number }[]
}

export interface PageLink {
  id: string
  trigger:
    | 'KEY_UP'
    | 'KEY_DOWN'
    | 'KEY_LEFT'
    | 'KEY_RIGHT'
    | 'KEY_OK'
    | 'KEY_BACK'
    | 'TIMER'
    | 'CONDITION'
  targetPageId: string
  transition: 'NONE' | 'SLIDE_LEFT' | 'SLIDE_RIGHT' | 'FADE'
  condition?: string
  timerMs?: number
}

export interface Project {
  config: ProjectConfig
  pages: Page[]
  currentPageId: string
  filePath?: string
  isDirty: boolean
}

export type ToolType =
  | 'select'
  | 'hStripSelect'
  | 'vStripSelect'
  | 'pixel'
  | 'line'
  | 'rect'
  | 'circle'
  | 'ellipse'
  | 'roundRect'
  | 'polygon'
  | 'text'
  | 'image'
  | 'eraser'
  | 'fill'

export interface HistoryState {
  pages: Page[]
  currentPageId: string
}

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      saveProject: (data: string, filePath?: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
      openProject: () => Promise<{ success: boolean; data?: string; filePath?: string; error?: string }>
      exportCode: (files: { name: string; content: string }[]) => Promise<{ success: boolean; exportDir?: string; error?: string }>
      importImage: () => Promise<{ success: boolean; dataUrl?: string; filePath?: string; error?: string }>
    }
  }
}

export {}
