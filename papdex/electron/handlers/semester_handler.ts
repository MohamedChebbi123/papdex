import { ipcMain } from "electron"
import database from "../database/connection"

function create_semester() {
    ipcMain.handle("semesters:create", (_event, year_id: number, name: string, start_date: string, end_date: string) => {
        const result = database.prepare(
            "INSERT INTO semesters (year_id, name, start_date, end_date) VALUES (?, ?, ?, ?)"
        ).run(year_id, name, start_date, end_date)
        return result.lastInsertRowid
    })
}

function fetch_semesters() {
    ipcMain.handle("semesters:getAll", () => {
        return database.prepare("SELECT * FROM semesters ORDER BY created_at DESC").all()
    })
}

function fetch_semesters_by_year() {
    ipcMain.handle("semesters:getByYear", (_event, year_id: number) => {
        return database.prepare("SELECT * FROM semesters WHERE year_id = ? ORDER BY created_at DESC").all(year_id)
    })
}

function fetch_semester_by_id() {
    ipcMain.handle("semesters:getById", (_event, id: number) => {
        return database.prepare("SELECT * FROM semesters WHERE id = ?").get(id)
    })
}

function update_semester() {
    ipcMain.handle("semesters:update", (_event, id: number, name: string, start_date: string, end_date: string) => {
        const result = database.prepare(
            "UPDATE semesters SET name = ?, start_date = ?, end_date = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(name, start_date, end_date, id)
        return result.changes
    })
}



function delete_semester() {
    ipcMain.handle("semesters:delete", (_event, id: number) => {
        const result = database.prepare("DELETE FROM semesters WHERE id = ?").run(id)
        return result.changes
    })
}

export function semester_handlers() {
    create_semester()
    fetch_semesters()
    fetch_semesters_by_year()
    fetch_semester_by_id()
    update_semester()
    delete_semester()
}
