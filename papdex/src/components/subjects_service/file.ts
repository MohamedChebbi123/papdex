export async function createSubject(semester_id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:create', semester_id, name)
}

export async function getSubjectsBySemester(semester_id: number): Promise<any[]> {
  return await window.ipcRenderer.invoke('subjects:getBySemester', semester_id)
}

export async function getSubjectsByYear(year_id: number): Promise<any[]> {
  return await window.ipcRenderer.invoke('subjects:getByYear', year_id)
}

export async function getSubjectById(id: number): Promise<any> {
  return await window.ipcRenderer.invoke('subjects:getById', id)
}

export async function updateSubject(id: number, name: string): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:update', id, name)
}

export async function toggleFavoriteSubject(id: number, is_favorite: number): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:toggleFavorite', id, is_favorite)
}

export async function getFavoriteSubjects(): Promise<any[]> {
  return await window.ipcRenderer.invoke('subjects:getFavorites')
}

export async function deleteSubject(id: number): Promise<number> {
  return await window.ipcRenderer.invoke('subjects:delete', id)
}
