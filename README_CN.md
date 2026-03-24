# OLED GUI 图形化编辑器

[**English**](README.md)

基于 Electron + Vue 3 的跨平台 OLED 屏幕可视化编辑器，支持自由设计界面并一键生成 STM32 可用的 C 代码。

## 功能特性

- **可视化编辑** — 在模拟 OLED 屏幕上直接绘制像素、线条、矩形、圆形、椭圆、圆角矩形、多边形、文字和图片
- **多页面支持** — 创建多个页面，支持页面间导航链接和转场动画
- **代码生成** — 一键导出完整的 STM32 C 源文件（HAL 库 / 标准库 / 纯寄存器）
- **多驱动支持** — SSD1306、SSD1309、SH1106
- **多接口支持** — I2C、SPI（三线 / 四线）
- **图片导入** — 支持图片导入，自动二值化和抖动处理
- **图层管理** — Z 轴排序、可见性切换、元素锁定
- **撤销/重做** — 完整的操作历史记录
- **快捷键** — 高效的键盘快捷操作

## 技术栈

| 技术 | 用途 |
|------|------|
| Vue 3 + TypeScript | 前端框架 |
| Electron | 跨平台桌面应用 |
| Vite | 构建工具 |
| Konva.js | Canvas 画布引擎 |
| Element Plus | UI 组件库 |
| Pinia | 状态管理 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 yarn

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/dignifnrfb/oled-gui-editor.git
cd oled-gui-editor

# 安装依赖
npm install

# 开发模式运行（Electron + Vite）
npm run electron:dev

# 或仅启动 Vite（浏览器预览）
npm run dev
```

### 构建

```bash
# 构建生产版本
npm run build

# 构建 Electron 安装包
npm run electron:build
```

## 支持的 OLED 配置

| 驱动芯片 | 分辨率 | 通信接口 |
|----------|--------|---------|
| SSD1306 | 128x64, 128x32 | I2C, SPI |
| SSD1309 | 128x64 | I2C, SPI |
| SH1106 | 128x64 | I2C, SPI |

## 生成代码结构

```
output/
├── oled_driver.h/.c    — OLED 驱动（I2C/SPI 初始化、指令、数据传输）
├── oled_font.h         — 字体数据（6x8、8x16 等）
├── oled_gui.h/.c       — GUI 框架（页面管理、转场动画、输入处理）
├── page_*.h/.c         — 各页面渲染函数
└── oled_images.h       — 图片位图数据（如有）
```

## 开源协议

[MIT](LICENSE)

## 参与贡献

欢迎提交 Issue 和 PR！
