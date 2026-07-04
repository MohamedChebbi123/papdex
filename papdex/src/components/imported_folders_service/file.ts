export interface ImportedFolder {
  id: number
  subject_id: number
  name: string
  original_path: string
  is_favorite: number
  file_count: number
  created_at: string
  updated_at: string
}

export interface ImportedFolderFile {
  id: number
  imported_folder_id: number
  file_name: string
  file_path: string
  file_type: string
  file_size: number | null
  relative_path: string
  created_at: string
  exists: boolean
}

export async function importFolder(subject_id: number): Promise<ImportedFolder | null> {
  return await window.ipcRenderer.invoke('importedFolders:import', subject_id)
}

export async function getImportedFoldersBySubject(subject_id: number): Promise<ImportedFolder[]> {
  return await window.ipcRenderer.invoke('importedFolders:getBySubject', subject_id)
}

export async function getImportedFolderById(id: number): Promise<ImportedFolder> {
  return await window.ipcRenderer.invoke('importedFolders:getById', id)
}

export async function getImportedFolderFiles(imported_folder_id: number): Promise<ImportedFolderFile[]> {
  return await window.ipcRenderer.invoke('importedFolders:getFiles', imported_folder_id)
}

export async function deleteImportedFolder(id: number): Promise<number> {
  return await window.ipcRenderer.invoke('importedFolders:delete', id)
}

export async function openImportedFile(file_path: string): Promise<void> {
  await window.ipcRenderer.invoke('importedFolders:openFile', file_path)
}

export async function readImportedFileBuffer(file_path: string): Promise<Uint8Array> {
  return await window.ipcRenderer.invoke('importedFolders:readBuffer', file_path)
}

export interface RecentImportedFile extends ImportedFolderFile {
  folder_name: string
  opened_at: string
}

export async function markImportedFileOpened(file_id: number): Promise<void> {
  await window.ipcRenderer.invoke('importedFolders:markOpened', file_id)
}

export async function getRecentImportedFilesBySubject(subject_id: number, limit = 5): Promise<RecentImportedFile[]> {
  return await window.ipcRenderer.invoke('importedFolders:getRecentBySubject', subject_id, limit)
}
