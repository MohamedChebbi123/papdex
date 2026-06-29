import { ipcMain, dialog, shell } from "electron"
import fs from "node:fs"
import path from "node:path"
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

function open_file_picker() {
    ipcMain.handle("files:openPicker", async (_event, subject_id: number, folder_id: number | null) => {
        const { filePaths, canceled } = await dialog.showOpenDialog({
            properties: ["openFile", "multiSelections"],
        })
        if (canceled || filePaths.length === 0) return []

        const inserted: object[] = []
        for (const fp of filePaths) {
            const stat      = fs.statSync(fp)
            const file_name = path.basename(fp)
            const file_type = path.extname(fp).replace(".", "").toLowerCase()
            const file_size = stat.size

            const result = database.prepare(`
                INSERT OR IGNORE INTO files (subject_id, folder_id, file_name, file_path, file_type, file_size)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(subject_id, folder_id ?? null, file_name, fp, file_type, file_size)

            if (result.changes > 0) {
                inserted.push({ id: Number(result.lastInsertRowid), file_name, file_path: fp, file_type, file_size })
            }
        }
        return inserted
    })
}

function read_file_buffer() {
    ipcMain.handle("files:readBuffer", (_event, file_path: string) => {
        return fs.readFileSync(file_path)
    })
}

function open_file() {
    ipcMain.handle("files:open", async (_event, file_path: string) => {
        const error = await shell.openPath(file_path)
        if (error) throw new Error(error)
    })
}

function pick_single_file() {
    ipcMain.handle("files:pickSingle", async () => {
        const { filePaths, canceled } = await dialog.showOpenDialog({
            properties: ["openFile"],
        })
        if (canceled || filePaths.length === 0) return null
        const fp   = filePaths[0]
        const stat = fs.statSync(fp)
        return {
            file_name: path.basename(fp),
            file_path: fp,
            file_ext:  path.extname(fp).replace(".", "").toLowerCase(),
            file_size: stat.size,
        }
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
    open_file_picker()
    pick_single_file()
    read_file_buffer()
    open_file()
}
