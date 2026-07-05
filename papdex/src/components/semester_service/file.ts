export interface Semester {
  id: number
  year_id: number
  name: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export async function createSemester(
  year_id: number,
  name: string,
  start_date: string,
  end_date: string
): Promise<number> {
  const id = await window.ipcRenderer.invoke('semesters:create', year_id, name, start_date, end_date)
  return id as number
}

export async function getAllSemesters(): Promise<Semester[]> {
  return await window.ipcRenderer.invoke('semesters:getAll')
}

export async function getSemestersByYear(year_id: number): Promise<Semester[]> {
  return await window.ipcRenderer.invoke('semesters:getByYear', year_id)
}

export async function getSemesterById(id: number): Promise<Semester | null> {
  return await window.ipcRenderer.invoke('semesters:getById', id)
}

export async function updateSemester(
  id: number,
  name: string,
  start_date: string,
  end_date: string
): Promise<number> {
  const changes = await window.ipcRenderer.invoke('semesters:update', id, name, start_date, end_date)
  return changes as number
}

export async function deleteSemester(id: number): Promise<number> {
  const changes = await window.ipcRenderer.invoke('semesters:delete', id)
  return changes as number
}
