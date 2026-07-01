export interface AppFile {
  id: number
  subject_id: number
  folder_id: number | null
  file_name: string
  file_path: string
  file_type: string
  file_size: number | null
  created_at: string
  updated_at: string
}

export interface PickedFile {
  file_name: string
  file_path: string
  file_ext: string
  file_size: number
}

export interface RecentFile {
  file_name: string
  file_type: string
  created_at: string
  subject_name: string
}

export async function pickSingleFile(): Promise<PickedFile | null> {
  return await window.ipcRenderer.invoke('files:pickSingle')
}

export async function createFile(
  subject_id: number,
  folder_id: number | null,
  file_name: string,
  file_path: string,
  file_type: string,
  file_size: number | null,
): Promise<number> {
  return await window.ipcRenderer.invoke('files:create', subject_id, folder_id, file_name, file_path, file_type, file_size)
}

export async function openFilePicker(subject_id: number, folder_id: number | null): Promise<AppFile[]> {
  return await window.ipcRenderer.invoke('files:openPicker', subject_id, folder_id)
}

export async function getFilesBySubject(subject_id: number): Promise<AppFile[]> {
  return await window.ipcRenderer.invoke('files:getBySubject', subject_id)
}

export async function getFilesByFolder(folder_id: number): Promise<AppFile[]> {
  return await window.ipcRenderer.invoke('files:getByFolder', folder_id)
}

export async function getFileById(id: number): Promise<AppFile> {
  return await window.ipcRenderer.invoke('files:getById', id)
}

export async function updateFile(id: number, file_name: string, folder_id: number | null): Promise<number> {
  return await window.ipcRenderer.invoke('files:update', id, file_name, folder_id)
}

export async function deleteFile(id: number): Promise<number> {
  return await window.ipcRenderer.invoke('files:delete', id)
}

export async function deleteFilesBySubject(subject_id: number): Promise<number> {
  return await window.ipcRenderer.invoke('files:deleteBySubject', subject_id)
}

export async function getFileCountBySemester(semester_id: number): Promise<number> {
  return await window.ipcRenderer.invoke('files:getCountBySemester', semester_id)
}

export async function getFileCountByYear(year_id: number): Promise<number> {
  return await window.ipcRenderer.invoke('files:getCountByYear', year_id)
}

export async function getRecentFilesBySemester(semester_id: number, limit: number): Promise<RecentFile[]> {
  return await window.ipcRenderer.invoke('files:getRecentBySemester', semester_id, limit)
}

export async function getRecentFilesByYear(year_id: number, limit: number): Promise<RecentFile[]> {
  return await window.ipcRenderer.invoke('files:getRecentByYear', year_id, limit)
}

export async function openFile(file_path: string): Promise<void> {
  await window.ipcRenderer.invoke('files:open', file_path)
}

export async function readFileBuffer(file_path: string): Promise<Uint8Array> {
  return await window.ipcRenderer.invoke('files:readBuffer', file_path)
}
