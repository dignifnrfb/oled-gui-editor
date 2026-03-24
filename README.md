# OLED GUI Editor

A cross-platform visual editor for OLED screens. Design your UI graphically and generate ready-to-use STM32 C code.

基于 Electron + Vue 3 的跨平台 OLED 屏幕可视化编辑器，支持自由设计界面并一键生成 STM32 可用的 C 代码。

---

## Features / 功能特性

- **Visual Editing** — Draw pixels, lines, rectangles, circles, ellipses, rounded rectangles, polygons, text and images directly on a simulated OLED screen
- **Multi-page Support** — Create multiple pages with navigation links and transitions
- **Code Generation** — Export complete C source files for STM32 (HAL / StdPeriph / bare-metal)
- **Multiple Drivers** — SSD1306, SSD1309, SH1106
- **Multiple Interfaces** — I2C, SPI (3-wire / 4-wire)
- **Image Import** — Import images with binarization and dithering for OLED display
- **Layer Management** — Z-index ordering, visibility toggling, element locking
- **Undo/Redo** — Full history support
- **Keyboard Shortcuts** — Efficient workflow with hotkeys

## Tech Stack / 技术栈

| Tech | Purpose |
|------|---------|
| Vue 3 + TypeScript | Frontend framework |
| Electron | Cross-platform desktop app |
| Vite | Build tool |
| Konva.js | Canvas rendering engine |
| Element Plus | UI components |
| Pinia | State management |

## Getting Started / 快速开始

### Prerequisites

- Node.js >= 18
- npm or yarn

### Install & Run

```bash
# Clone the repository
git clone https://github.com/dignifnrfb/oled-gui-editor.git
cd oled-gui-editor

# Install dependencies
npm install

# Run in development mode (Electron + Vite)
npm run electron:dev

# Or run Vite only (web preview)
npm run dev
```

### Build

```bash
# Build production app
npm run build

# Build Electron installer
npm run electron:build
```

## Supported OLED Configurations / 支持的 OLED 配置

| Driver | Resolution | Interface |
|--------|-----------|-----------|
| SSD1306 | 128x64, 128x32 | I2C, SPI |
| SSD1309 | 128x64 | I2C, SPI |
| SH1106 | 128x64 | I2C, SPI |

## Generated Code Structure / 生成代码结构

```
output/
├── oled_driver.h/.c    — OLED driver (I2C/SPI init, commands, data transfer)
├── oled_font.h         — Font data (6x8, 8x16, etc.)
├── oled_gui.h/.c       — GUI framework (page manager, transitions, input handling)
├── page_*.h/.c         — Individual page rendering functions
└── oled_images.h       — Image bitmap data (if any)
```

## License / 许可证

[MIT](LICENSE)

## Contributing / 参与贡献

Issues and Pull Requests are welcome!

欢迎提交 Issue 和 PR！
