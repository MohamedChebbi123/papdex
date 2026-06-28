export async function createAcademicYear(
  name: string,
  start_date: string,
  end_date: string
): Promise<number> {
  const id = await window.ipcRenderer.invoke('academic_years:create', name, start_date, end_date)
  return id as number
}

export async function getAllAcademicYears(): Promise<any[]> {
  const rows = await window.ipcRenderer.invoke('academic_years:getAll')
  return rows as any[]
}

export async function getAcademicYearById(id: number): Promise<any> {
  const row = await window.ipcRenderer.invoke('academic_years:getById', id)
  return row
}

export async function updateAcademicYear(
  id: number,
  name: string,
  start_date: string,
  end_date: string
): Promise<number> {
  const changes = await window.ipcRenderer.invoke('academic_years:update', id, name, start_date, end_date)
  return changes as number
}

export async function deleteAcademicYear(id: number): Promise<number> {
  const changes = await window.ipcRenderer.invoke('academic_years:delete', id)
  return changes as number
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

export async function getAllSemesters(): Promise<any[]> {
  const rows = await window.ipcRenderer.invoke('semesters:getAll')
  return rows as any[]
}

export async function getSemestersByYear(year_id: number): Promise<any[]> {
  const rows = await window.ipcRenderer.invoke('semesters:getByYear', year_id)
  return rows as any[]
}

export async function getSemesterById(id: number): Promise<any> {
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
