export interface VirtualFolder {
  id: number
  subject_id: number
  parent_folder_id: number | null
  name: string
  created_at: string
  updated_at: string
}

export interface VirtualFolderWithFileCount extends VirtualFolder {
  file_count: number
}

export interface VirtualFolderWithCounts extends VirtualFolderWithFileCount {
  subfolder_count: number
}

export async function createVirtualFolder(subject_id: number, name: string, parent_folder_id: number | null = null): Promise<number> {
  return await window.ipcRenderer.invoke('virtualFolders:create', subject_id, name, parent_folder_id)
}

export async function getVirtualFoldersBySubject(subject_id: number): Promise<VirtualFolderWithFileCount[]> {
  return await window.ipcRenderer.invoke('virtualFolders:getBySubject', subject_id)
}

export async function getVirtualFolderChildren(subject_id: number, parent_folder_id: number | null): Promise<VirtualFolderWithCounts[]> {
  return await window.ipcRenderer.invoke('virtualFolders:getChildren', subject_id, parent_folder_id)
}

export async function getVirtualFolderPath(folder_id: number): Promise<{ id: number; name: string }[]> {
  return await window.ipcRenderer.invoke('virtualFolders:getPath', folder_id)
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
