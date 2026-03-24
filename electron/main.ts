import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import * as fs from 'fs'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset',
    frame: true,
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers
ipcMain.handle('save-project', async (_event, data: string, filePath?: string) => {
  try {
    if (!filePath) {
      const result = await dialog.showSaveDialog(mainWindow!, {
        title: '保存项目',
        defaultPath: 'project.oled',
        filters: [{ name: 'OLED Project', extensions: ['oled'] }]
      })
      if (result.canceled || !result.filePath) return { success: false }
      filePath = result.filePath
    }
    // Ensure file has .oled extension for re-import compatibility
    if (!filePath.toLowerCase().endsWith('.oled')) {
      filePath = `${filePath}.oled`
    }
    fs.writeFileSync(filePath, data, 'utf-8')
    return { success: true, filePath }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('open-project', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '打开项目',
      filters: [{ name: 'OLED Project', extensions: ['oled'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false }
    const data = fs.readFileSync(result.filePaths[0], 'utf-8')
    return { success: true, data, filePath: result.filePaths[0] }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('export-code', async (_event, files: { name: string; content: string }[]) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '选择导出目录',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false }

    const baseDir = result.filePaths[0]
    // 将所有生成文件放入一个子文件夹，避免散落
    let exportDir = join(baseDir, 'oled_export')
    if (fs.existsSync(exportDir)) {
      exportDir = join(baseDir, `oled_export_${Date.now()}`)
    }
    fs.mkdirSync(exportDir, { recursive: true })

    for (const file of files) {
      fs.writeFileSync(join(exportDir, file.name), file.content, 'utf-8')
    }
    return { success: true, exportDir }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('import-image', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '导入图像',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif'] }],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) return { success: false }

    const imageData = fs.readFileSync(result.filePaths[0])
    const base64 = imageData.toString('base64')
    const ext = result.filePaths[0].split('.').pop()?.toLowerCase() || 'png'
    return {
      success: true,
      dataUrl: `data:image/${ext};base64,${base64}`,
      filePath: result.filePaths[0]
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})
