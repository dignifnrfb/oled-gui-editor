# 「告别手写像素坐标」—— 开源 OLED 图形化编辑器，拖拽设计界面，一键生成 STM32 C 代码

## 先讲个故事

大二上学期接了个课设，要在 STM32 上驱动一块 0.96 寸的 OLED 小屏幕，显示几个菜单页面。

听起来不难对吧？

然后我就开始了地狱般的调参之旅：

```c
OLED_ShowString(24, 0, "Menu", 16);
OLED_DrawLine(0, 18, 127, 18);
OLED_ShowString(8, 24, "> Option 1", 12);
OLED_ShowString(8, 38, "  Option 2", 12);
OLED_ShowString(8, 52, "  Option 3", 12);
```

**改个文字位置？** 改坐标，编译，烧录，看效果，不对，再改。

**加个矩形边框？** 算半天 x1 y1 x2 y2，编译，烧录，歪了，再算。

**做第二个页面？** 复制粘贴一整坨代码，改着改着分不清哪个是哪个了。

那天晚上我对着屏幕上歪了 3 个像素的菜单框，认真思考了一下人生——

> 明明界面设计这件事，应该是「看着画」的，为什么我在「盲写坐标」？

于是这个项目就诞生了。

---

## 它是什么

**OLED GUI Editor** —— 一个桌面端的 OLED 屏幕可视化编辑器。

简单来说：**像画 PPT 一样设计 OLED 界面，画完直接导出 STM32 能用的 C 代码。**

| 可视化编辑器 | 项目配置 |
|:---:|:---:|
| ![编辑器](https://raw.githubusercontent.com/dignifnrfb/oled-gui-editor/master/screenshots/editor.png) | ![设置](https://raw.githubusercontent.com/dignifnrfb/oled-gui-editor/master/screenshots/settings.png) |

## 能干什么

- **所见即所得**：在模拟的 OLED 屏幕上直接画——点、线、矩形、圆、椭圆、圆角矩形、多边形、文字、图片，全部支持
- **多页面管理**：每个页面独立编辑，支持页面间导航和转场
- **一键生成代码**：导出完整的 C 源文件，拷到工程里就能编译
- **多驱动适配**：SSD1306 / SSD1309 / SH1106，I2C / SPI 都支持
- **多代码风格**：HAL 库、标准库、纯寄存器，按你的项目选
- **图片导入**：丢张图进去，自动二值化处理成 OLED 能显示的位图
- **图层、撤销/重做、快捷键**：该有的都有

## 技术栈

Electron + Vue 3 + TypeScript + Konva.js + Element Plus

选 Electron 是因为需要文件系统访问（导出代码文件），选 Konva 是因为要做像素级的画布操作。整体算是一个比较标准的桌面端 Web 应用架构。

## 快速体验

```bash
git clone https://github.com/dignifnrfb/oled-gui-editor.git
cd oled-gui-editor
npm install
npm run dev
```

Node.js >= 18 即可。

## 项目地址

**GitHub**: https://github.com/dignifnrfb/oled-gui-editor

MIT 协议，放心用。

---

这是我的第一个开源项目，功能还在持续完善中。如果你也被 OLED 的像素坐标折磨过，欢迎来试试，也欢迎提 Issue 和 PR。

如果觉得有用，给个 Star 就是最大的鼓励 :)

---

友链：[Linux.do](https://linux.do/)
