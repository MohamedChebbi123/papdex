
import { ipcMain } from "electron"
import database from "../database/connection"

function create_academic_years(){
    ipcMain.handle("academic_years:create", (_event, name: string, start_date: string, end_date: string) => {
        const result = database.prepare(
            "INSERT INTO academic_years (name, start_date, end_date) VALUES (?, ?, ?)"
        ).run(name, start_date, end_date)
        return result.lastInsertRowid
    })
}

function fetch_academic_years(){
    ipcMain.handle("academic_years:getAll",()=>{
        const academic_years = database.prepare("SELECT * FROM academic_years ORDER BY created_at DESC").all()
        return academic_years
    })
}

function update_academic_years(){
    ipcMain.handle("academic_years:update",(_event, id: number, name: string, start_date: string, end_date: string)=>{
        const result = database.prepare(
            "UPDATE academic_years SET name = ?, start_date = ?, end_date = ? WHERE id = ?"
        ).run(name, start_date, end_date, id)
        return result.changes
    })
}



function delete_academic_year(){
    ipcMain.handle("academic_years:delete", (_event, id: number) => {
        const result = database.prepare("DELETE FROM academic_years WHERE id = ?").run(id)
        return result.changes
    })
}

function fetch_academic_year_by_id(){
    ipcMain.handle("academic_years:getById", (_event, id: number) => {
        const academic_year = database.prepare("SELECT * FROM academic_years WHERE id = ?").get(id)
        return academic_year
    })
}

export function academic_years_handlers(){
    create_academic_years()
    fetch_academic_years()
    update_academic_years()
    delete_academic_year()
    fetch_academic_year_by_id()
}