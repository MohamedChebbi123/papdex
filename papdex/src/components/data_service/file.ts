export async function deleteAllData(): Promise<void> {
  await window.ipcRenderer.invoke('data:deleteAll')
}

export async function exportBackup(): Promise<string | null> {
  return window.ipcRenderer.invoke('data:exportBackup')
}

export async function restoreBackup(): Promise<boolean> {
  return window.ipcRenderer.invoke('data:restoreBackup')
}
