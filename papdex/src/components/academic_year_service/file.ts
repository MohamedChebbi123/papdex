export interface AcademicYear {
  id: number
  name: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export async function createAcademicYear(
  name: string,
  start_date: string,
  end_date: string
): Promise<number> {
  const id = await window.ipcRenderer.invoke('academic_years:create', name, start_date, end_date)
  return id as number
}

export async function getAllAcademicYears(): Promise<AcademicYear[]> {
  return await window.ipcRenderer.invoke('academic_years:getAll')
}

export async function getAcademicYearById(id: number): Promise<AcademicYear | null> {
  return await window.ipcRenderer.invoke('academic_years:getById', id)
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
