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

function fetch_favorite_subjects() {
    ipcMain.handle("subjects:getFavorites", () => {
        return database.prepare(`
            SELECT
                s.id, s.name, s.semester_id, s.is_favorite,
                sem.name        AS semester_name,
                sem.start_date  AS semester_start_date,
                sem.end_date    AS semester_end_date,
                ay.id           AS year_id,
                ay.name         AS year_name,
                ay.start_date   AS year_start_date,
                ay.end_date     AS year_end_date
            FROM subjects s
            JOIN semesters sem ON s.semester_id = sem.id
            JOIN academic_years ay ON sem.year_id = ay.id
            WHERE s.is_favorite = 1
            ORDER BY ay.name, sem.name, s.name
        `).all()
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
    fetch_favorite_subjects()
    delete_subject()
}
