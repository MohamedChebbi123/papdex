import { ipcMain } from "electron"
import database from "../database/connection"

function create_file() {
    ipcMain.handle("files:create", (
        _event,
        subject_id: number,
        folder_id: number | null,
        file_name: string,
        file_path: string,
        file_type: string,
        file_size: number | null
    ) => {
        const result = database.prepare(`
            INSERT INTO files (subject_id, folder_id, file_name, file_path, file_type, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(subject_id, folder_id ?? null, file_name, file_path, file_type, file_size ?? null)
        return result.lastInsertRowid
    })
}

function fetch_files_by_subject() {
    ipcMain.handle("files:getBySubject", (_event, subject_id: number) => {
        return database.prepare(
            "SELECT * FROM files WHERE subject_id = ? ORDER BY created_at DESC"
        ).all(subject_id)
    })
}

function fetch_files_by_folder() {
    ipcMain.handle("files:getByFolder", (_event, folder_id: number) => {
        return database.prepare(
            "SELECT * FROM files WHERE folder_id = ? ORDER BY created_at DESC"
        ).all(folder_id)
    })
}

function fetch_file_by_id() {
    ipcMain.handle("files:getById", (_event, id: number) => {
        return database.prepare("SELECT * FROM files WHERE id = ?").get(id)
    })
}

function update_file() {
    ipcMain.handle("files:update", (
        _event,
        id: number,
        file_name: string,
        folder_id: number | null
    ) => {
        const result = database.prepare(`
            UPDATE files
            SET file_name = ?, folder_id = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(file_name, folder_id ?? null, id)
        return result.changes
    })
}

function delete_file() {
    ipcMain.handle("files:delete", (_event, id: number) => {
        const result = database.prepare("DELETE FROM files WHERE id = ?").run(id)
        return result.changes
    })
}

function delete_files_by_subject() {
    ipcMain.handle("files:deleteBySubject", (_event, subject_id: number) => {
        const result = database.prepare("DELETE FROM files WHERE subject_id = ?").run(subject_id)
        return result.changes
    })
}

export function file_handlers() {
    create_file()
    fetch_files_by_subject()
    fetch_files_by_folder()
    fetch_file_by_id()
    update_file()
    delete_file()
    delete_files_by_subject()
}
