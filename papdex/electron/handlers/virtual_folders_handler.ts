import { ipcMain } from "electron"
import database from "../database/connection"

function create_virtual_folder() {
    ipcMain.handle("virtualFolders:create", (_event, subject_id: number, name: string) => {
        const result = database.prepare(
            "INSERT INTO virtual_folders (subject_id, name) VALUES (?, ?)"
        ).run(subject_id, name)
        return result.lastInsertRowid
    })
}

function fetch_virtual_folders_by_subject() {
    ipcMain.handle("virtualFolders:getBySubject", (_event, subject_id: number) => {
        return database.prepare(
            "SELECT * FROM virtual_folders WHERE subject_id = ? ORDER BY created_at DESC"
        ).all(subject_id)
    })
}

function fetch_virtual_folder_by_id() {
    ipcMain.handle("virtualFolders:getById", (_event, id: number) => {
        return database.prepare("SELECT * FROM virtual_folders WHERE id = ?").get(id)
    })
}

function update_virtual_folder() {
    ipcMain.handle("virtualFolders:update", (_event, id: number, name: string) => {
        const result = database.prepare(
            "UPDATE virtual_folders SET name = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(name, id)
        return result.changes
    })
}

function toggle_favorite_virtual_folder() {
    ipcMain.handle("virtualFolders:toggleFavorite", (_event, id: number, is_favorite: number) => {
        const result = database.prepare(
            "UPDATE virtual_folders SET is_favorite = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(is_favorite, id)
        return result.changes
    })
}

function delete_virtual_folder() {
    ipcMain.handle("virtualFolders:delete", (_event, id: number) => {
        const result = database.prepare("DELETE FROM virtual_folders WHERE id = ?").run(id)
        return result.changes
    })
}

export function virtual_folder_handlers() {
    create_virtual_folder()
    fetch_virtual_folders_by_subject()
    fetch_virtual_folder_by_id()
    update_virtual_folder()
    toggle_favorite_virtual_folder()
    delete_virtual_folder()
}
