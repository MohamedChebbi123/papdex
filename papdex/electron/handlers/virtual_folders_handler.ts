import { ipcMain } from "electron"
import database from "../database/connection"

function create_virtual_folder() {
    ipcMain.handle("virtualFolders:create", (_event, subject_id: number, name: string, parent_folder_id: number | null = null) => {
        const result = database.prepare(
            "INSERT INTO virtual_folders (subject_id, name, parent_folder_id) VALUES (?, ?, ?)"
        ).run(subject_id, name, parent_folder_id)
        return result.lastInsertRowid
    })
}

function fetch_virtual_folders_by_subject() {
    ipcMain.handle("virtualFolders:getBySubject", (_event, subject_id: number) => {
        return database.prepare(`
            SELECT v.*,
                (SELECT COUNT(*) FROM files f WHERE f.folder_id = v.id) AS file_count
            FROM virtual_folders v
            WHERE v.subject_id = ?
            ORDER BY v.created_at DESC
        `).all(subject_id)
    })
}

function fetch_virtual_folder_children() {
    ipcMain.handle("virtualFolders:getChildren", (_event, subject_id: number, parent_folder_id: number | null) => {
        return database.prepare(`
            SELECT v.*,
                (SELECT COUNT(*) FROM files f WHERE f.folder_id = v.id) AS file_count,
                (SELECT COUNT(*) FROM virtual_folders sub WHERE sub.parent_folder_id = v.id) AS subfolder_count
            FROM virtual_folders v
            WHERE v.subject_id = ? AND v.parent_folder_id IS ?
            ORDER BY v.created_at DESC
        `).all(subject_id, parent_folder_id)
    })
}

function fetch_virtual_folder_path() {
    ipcMain.handle("virtualFolders:getPath", (_event, folder_id: number) => {
        return database.prepare(`
            WITH RECURSIVE ancestors(id, name, parent_folder_id, depth) AS (
                SELECT id, name, parent_folder_id, 0 FROM virtual_folders WHERE id = ?
                UNION ALL
                SELECT v.id, v.name, v.parent_folder_id, a.depth + 1
                FROM virtual_folders v JOIN ancestors a ON v.id = a.parent_folder_id
            )
            SELECT id, name FROM ancestors WHERE id != ? ORDER BY depth DESC
        `).all(folder_id, folder_id)
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

function delete_virtual_folder() {
    ipcMain.handle("virtualFolders:delete", (_event, id: number) => {
        const result = database.prepare("DELETE FROM virtual_folders WHERE id = ?").run(id)
        return result.changes
    })
}

export function virtual_folder_handlers() {
    create_virtual_folder()
    fetch_virtual_folders_by_subject()
    fetch_virtual_folder_children()
    fetch_virtual_folder_path()
    fetch_virtual_folder_by_id()
    update_virtual_folder()
    delete_virtual_folder()
}
