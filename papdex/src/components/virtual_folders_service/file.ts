export async function createVirtualFolder(subject_id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:create', subject_id, name)
}

export async function getVirtualFoldersBySubject(subject_id: number): Promise<any[]> {
  return await window.ipcRenderer.invoke('virtualFolders:getBySubject', subject_id)
}

export async function getVirtualFolderById(id: number): Promise<any> {
  return await window.ipcRenderer.invoke('virtualFolders:getById', id)
}

export async function updateVirtualFolder(id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:update', id, name)
}

export async function toggleFavoriteVirtualFolder(id: number, is_favorite: number): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:toggleFavorite', id, is_favorite)
}

export async function deleteVirtualFolder(id: number): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:delete', id)
}
