import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveProject: (data: string, filePath?: string) =>
    ipcRenderer.invoke('save-project', data, filePath),
  openProject: () =>
    ipcRenderer.invoke('open-project'),
  exportCode: (files: { name: string; content: string }[]) =>
    ipcRenderer.invoke('export-code', files),
  importImage: () =>
    ipcRenderer.invoke('import-image')
})
