export interface Subject {
  id: number
  semester_id: number
  name: string
  is_favorite: number
  created_at: string
  updated_at: string
}

export interface SubjectWithFileCount extends Subject {
  file_count: number
}

export interface SubjectByYear {
  id: number
  semester_id: number
  name: string
  is_favorite: number
  created_at: string
  semester_name: string
  semester_start_date: string
  semester_end_date: string
  file_count: number
}

export interface FavoriteSubject {
  id: number
  name: string
  semester_id: number
  is_favorite: number
  semester_name: string
  semester_start_date: string
  semester_end_date: string
  year_id: number
  year_name: string
  year_start_date: string
  year_end_date: string
}

export async function createSubject(semester_id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:create', semester_id, name)
}

export async function getSubjectsBySemester(semester_id: number): Promise<SubjectWithFileCount[]> {
  return await window.ipcRenderer.invoke('subjects:getBySemester', semester_id)
}

export async function getSubjectsByYear(year_id: number): Promise<SubjectByYear[]> {
  return await window.ipcRenderer.invoke('subjects:getByYear', year_id)
}

export async function getSubjectById(id: number): Promise<Subject | null> {
  return await window.ipcRenderer.invoke('subjects:getById', id)
}

export async function updateSubject(id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:update', id, name)
}

export async function toggleFavoriteSubject(id: number, is_favorite: number): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:toggleFavorite', id, is_favorite)
}

export async function getFavoriteSubjects(): Promise<FavoriteSubject[]> {
  return await window.ipcRenderer.invoke('subjects:getFavorites')
}

export async function deleteSubject(id: number): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:delete', id)
}
