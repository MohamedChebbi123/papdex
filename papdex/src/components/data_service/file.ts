export async function deleteAllData(): Promise<void> {
  await window.ipcRenderer.invoke('data:deleteAll')
}
