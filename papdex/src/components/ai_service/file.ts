export interface AiModel {
  id: string
  name: string
  tier: 1 | 2 | 3 | 4
  params: string
  quant: string
  approxSizeGB: number
  minRamGB: number
  requiresGpu: boolean
  description: string
  hfRepo: string
  downloaded: boolean
}

export interface AiDownloadProgress {
  modelId: string
  downloadedSize: number
  totalSize: number
}

export async function getAiCatalog(): Promise<AiModel[]> {
  return await window.ipcRenderer.invoke('ai:getCatalog')
}

export async function downloadAiModel(modelId: string): Promise<string> {
  return await window.ipcRenderer.invoke('ai:downloadModel', modelId)
}

export async function cancelAiDownload(modelId: string): Promise<boolean> {
  return await window.ipcRenderer.invoke('ai:cancelDownload', modelId)
}

export async function deleteAiModel(modelId: string): Promise<boolean> {
  return await window.ipcRenderer.invoke('ai:deleteModel', modelId)
}

export async function loadAiModel(modelId: string): Promise<boolean> {
  return await window.ipcRenderer.invoke('ai:loadModel', modelId)
}

export async function unloadAiModel(): Promise<boolean> {
  return await window.ipcRenderer.invoke('ai:unloadModel')
}

export async function getActiveAiModel(): Promise<string | null> {
  return await window.ipcRenderer.invoke('ai:getActiveModel')
}

export async function promptAiModel(message: string): Promise<string> {
  return await window.ipcRenderer.invoke('ai:prompt', message)
}

export function onAiDownloadProgress(callback: (progress: AiDownloadProgress) => void) {
  const listener = (_event: unknown, progress: AiDownloadProgress) => callback(progress)
  window.ipcRenderer.on('ai:downloadProgress', listener)
  return () => window.ipcRenderer.off('ai:downloadProgress', listener)
}

export function onAiPromptChunk(callback: (chunk: string) => void) {
  const listener = (_event: unknown, chunk: string) => callback(chunk)
  window.ipcRenderer.on('ai:promptChunk', listener)
  return () => window.ipcRenderer.off('ai:promptChunk', listener)
}
