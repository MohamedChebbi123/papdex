import { ipcMain, dialog, shell } from "electron"
import fs from "node:fs"
import path from "node:path"
import database from "../database/connection"

function walk_directory(dir: string, base: string, results: { file_name: string; file_path: string; file_type: string; file_size: number; relative_path: string }[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
        const full = path.join(dir, entry.name)
        const rel  = base ? `${base}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
            walk_directory(full, rel, results)
        } else {
            const stat = fs.statSync(full)
            results.push({
                file_name:     entry.name,
                file_path:     full,
                file_type:     path.extname(entry.name).replace(".", "").toLowerCase(),
                file_size:     stat.size,
                relative_path: rel,
            })
        }
    }
}

function import_folder() {
    ipcMain.handle("importedFolders:import", async (_event, subject_id: number) => {
        const { filePaths, canceled } = await dialog.showOpenDialog({
            properties: ["openDirectory"],
        })
        if (canceled || filePaths.length === 0) return null

        const folder_path = filePaths[0]
        const folder_name = path.basename(folder_path)

        const folder_result = database.prepare(
            "INSERT INTO imported_folders (subject_id, name, original_path) VALUES (?, ?, ?)"
        ).run(subject_id, folder_name, folder_path)
        const imported_folder_id = Number(folder_result.lastInsertRowid)

        const file_entries: { file_name: string; file_path: string; file_type: string; file_size: number; relative_path: string }[] = []
        walk_directory(folder_path, "", file_entries)

        const insert_file = database.prepare(
            "INSERT OR IGNORE INTO imported_folder_files (imported_folder_id, file_name, file_path, file_type, file_size, relative_path) VALUES (?, ?, ?, ?, ?, ?)"
        )
        const insert_many = database.transaction((files: typeof file_entries) => {
            for (const f of files) {
                insert_file.run(imported_folder_id, f.file_name, f.file_path, f.file_type, f.file_size, f.relative_path)
            }
        })
        insert_many(file_entries)

        return {
            id:            imported_folder_id,
            subject_id,
            name:          folder_name,
            original_path: folder_path,
            is_favorite:   0,
            file_count:    file_entries.length,
        }
    })
}

function fetch_imported_folders_by_subject() {
    ipcMain.handle("importedFolders:getBySubject", (_event, subject_id: number) => {
        const rows = database.prepare(
            "SELECT f.*, COUNT(ff.id) as file_count FROM imported_folders f LEFT JOIN imported_folder_files ff ON ff.imported_folder_id = f.id WHERE f.subject_id = ? GROUP BY f.id ORDER BY f.created_at DESC"
        ).all(subject_id)
        return rows
    })
}

function fetch_imported_folder_by_id() {
    ipcMain.handle("importedFolders:getById", (_event, id: number) => {
        return database.prepare("SELECT * FROM imported_folders WHERE id = ?").get(id)
    })
}

function fetch_imported_folder_files() {
    ipcMain.handle("importedFolders:getFiles", (_event, imported_folder_id: number) => {
        return database.prepare(
            "SELECT * FROM imported_folder_files WHERE imported_folder_id = ? ORDER BY relative_path ASC"
        ).all(imported_folder_id)
    })
}

function delete_imported_folder() {
    ipcMain.handle("importedFolders:delete", (_event, id: number) => {
        const result = database.prepare("DELETE FROM imported_folders WHERE id = ?").run(id)
        return result.changes
    })
}

function open_imported_file() {
    ipcMain.handle("importedFolders:openFile", async (_event, file_path: string) => {
        const error = await shell.openPath(file_path)
        if (error) throw new Error(error)
    })
}

function read_imported_file_buffer() {
    ipcMain.handle("importedFolders:readBuffer", (_event, file_path: string) => {
        return fs.readFileSync(file_path)
    })
}

function mark_imported_file_opened() {
    ipcMain.handle("importedFolders:markOpened", (_event, file_id: number) => {
        database.prepare(`
            INSERT INTO imported_file_opens (file_id, opened_at) VALUES (?, datetime('now'))
            ON CONFLICT(file_id) DO UPDATE SET opened_at = datetime('now')
        `).run(file_id)
    })
}

function fetch_recent_imported_files_by_subject() {
    ipcMain.handle("importedFolders:getRecentBySubject", (_event, subject_id: number, limit: number) => {
        return database.prepare(`
            SELECT iff.*, imf.name AS folder_name, io.opened_at
            FROM imported_file_opens io
            JOIN imported_folder_files iff ON iff.id = io.file_id
            JOIN imported_folders imf ON imf.id = iff.imported_folder_id
            WHERE imf.subject_id = ?
            ORDER BY io.opened_at DESC
            LIMIT ?
        `).all(subject_id, limit)
    })
}

export function imported_folder_handlers() {
    import_folder()
    fetch_imported_folders_by_subject()
    fetch_imported_folder_by_id()
    fetch_imported_folder_files()
    delete_imported_folder()
    open_imported_file()
    read_imported_file_buffer()
    mark_imported_file_opened()
    fetch_recent_imported_files_by_subject()
}
