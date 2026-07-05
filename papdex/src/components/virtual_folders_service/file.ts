export interface VirtualFolder {
  id: number
  subject_id: number
  name: string
  created_at: string
  updated_at: string
}

export interface VirtualFolderWithFileCount extends VirtualFolder {
  file_count: number
}

export async function createVirtualFolder(subject_id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:create', subject_id, name)
}

export async function getVirtualFoldersBySubject(subject_id: number): Promise<VirtualFolderWithFileCount[]> {
  return await window.ipcRenderer.invoke('virtualFolders:getBySubject', subject_id)
}

export async function getVirtualFolderById(id: number): Promise<VirtualFolder | null> {
  return await window.ipcRenderer.invoke('virtualFolders:getById', id)
}

export async function updateVirtualFolder(id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:update', id, name)
}

export async function deleteVirtualFolder(id: number): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:delete', id)
}
