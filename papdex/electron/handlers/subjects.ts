import { ipcMain } from "electron"
import database from "../database/connection"

function create_subject() {
    ipcMain.handle("subjects:create", (_event, semester_id: number, name: string) => {
        const result = database.prepare(
            "INSERT INTO subjects (semester_id, name) VALUES (?, ?)"
        ).run(semester_id, name)
        return result.lastInsertRowid
    })
}

function fetch_subjects_by_semester() {
    ipcMain.handle("subjects:getBySemester", (_event, semester_id: number) => {
        return database.prepare("SELECT * FROM subjects WHERE semester_id = ? ORDER BY created_at DESC").all(semester_id)
    })
}

function fetch_subject_by_id() {
    ipcMain.handle("subjects:getById", (_event, id: number) => {
        return database.prepare("SELECT * FROM subjects WHERE id = ?").get(id)
    })
}

function update_subject() {
    ipcMain.handle("subjects:update", (_event, id: number, name: string) => {
        const result = database.prepare(
            "UPDATE subjects SET name = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(name, id)
        return result.changes
    })
}

function toggle_favorite_subject() {
    ipcMain.handle("subjects:toggleFavorite", (_event, id: number, is_favorite: number) => {
        const result = database.prepare(
            "UPDATE subjects SET is_favorite = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(is_favorite, id)
        return result.changes
    })
}

function delete_subject() {
    ipcMain.handle("subjects:delete", (_event, id: number) => {
        const result = database.prepare("DELETE FROM subjects WHERE id = ?").run(id)
        return result.changes
    })
}

export function subject_handlers() {
    create_subject()
    fetch_subjects_by_semester()
    fetch_subject_by_id()
    update_subject()
    toggle_favorite_subject()
    delete_subject()
}
