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
  exists: boolean
}

export interface PickedFile {
  file_name: string
  file_path: string
  file_ext: string
  file_size: number
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

export async function updateFileCategory(id: number, file_type: string): Promise<number> {
  return await window.ipcRenderer.invoke('files:updateCategory', id, file_type)
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

export async function openFile(file_path: string): Promise<void> {
  await window.ipcRenderer.invoke('files:open', file_path)
}

export async function openExternalLink(url: string): Promise<void> {
  await window.ipcRenderer.invoke('shell:openExternal', url)
}

export async function readFileBuffer(file_path: string): Promise<Uint8Array> {
  return await window.ipcRenderer.invoke('files:readBuffer', file_path)
}

export interface RecentFile extends AppFile {
  subject_name: string
  opened_at: string
}

export async function markFileOpened(file_id: number): Promise<void> {
  await window.ipcRenderer.invoke('files:markOpened', file_id)
}

export async function getRecentFilesBySubject(subject_id: number, limit = 5): Promise<RecentFile[]> {
  return await window.ipcRenderer.invoke('files:getRecentBySubject', subject_id, limit)
}

export async function getRecentFilesBySemester(semester_id: number, limit = 5): Promise<RecentFile[]> {
  return await window.ipcRenderer.invoke('files:getRecentBySemester', semester_id, limit)
}

export async function getRecentFilesByYear(year_id: number, limit = 5): Promise<RecentFile[]> {
  return await window.ipcRenderer.invoke('files:getRecentByYear', year_id, limit)
}

export async function getFileTypeCountBySemester(semester_id: number, file_type: string): Promise<number> {
  return await window.ipcRenderer.invoke('files:getTypeCountBySemester', semester_id, file_type)
}

export interface SearchResult {
  id: number
  file_name: string
  file_path: string
  file_type: string
  kind: "virtual" | "imported"
  folder_id: number | null
  folder_name: string | null
  subject_id: number
  subject_name: string
  semester_id: number
  semester_name: string
  semester_start_date: string
  semester_end_date: string
  year_id: number
  year_name: string
  year_start_date: string
  year_end_date: string
}

export interface SearchFilters {
  subjectId?: number | null
  semesterId?: number | null
  fileType?: string | null
}

export async function searchFiles(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
  return await window.ipcRenderer.invoke('files:search', query, filters)
}

export interface SearchFilterSemester {
  id: number
  name: string
  year_id: number
  year_name: string
}

export interface SearchFilterSubject {
  id: number
  name: string
  semester_id: number
  semester_name: string
  year_id: number
  year_name: string
}

export interface SearchFilterOptions {
  semesters: SearchFilterSemester[]
  subjects: SearchFilterSubject[]
  types: string[]
}

export async function getSearchFilterOptions(): Promise<SearchFilterOptions> {
  return await window.ipcRenderer.invoke('files:getSearchFilterOptions')
}
