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

function with_exists<T extends { file_path: string }>(rows: T[]): (T & { exists: boolean })[] {
    return rows.map(row => ({ ...row, exists: fs.existsSync(row.file_path) }))
}

function fetch_files_by_subject() {
    ipcMain.handle("files:getBySubject", (_event, subject_id: number) => {
        const rows = database.prepare(
            "SELECT * FROM files WHERE subject_id = ? ORDER BY created_at DESC"
        ).all(subject_id) as { file_path: string }[]
        return with_exists(rows)
    })
}

function fetch_files_by_folder() {
    ipcMain.handle("files:getByFolder", (_event, folder_id: number) => {
        const rows = database.prepare(
            "SELECT * FROM files WHERE folder_id = ? ORDER BY created_at DESC"
        ).all(folder_id) as { file_path: string }[]
        return with_exists(rows)
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

function update_file_category() {
    ipcMain.handle("files:updateCategory", (
        _event,
        id: number,
        file_type: string
    ) => {
        const result = database.prepare(`
            UPDATE files
            SET file_type = ?, updated_at = datetime('now')
            WHERE id = ?
        `).run(file_type, id)
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

function fetch_file_count_by_semester() {
    ipcMain.handle("files:getCountBySemester", (_event, semester_id: number) => {
        const row = database.prepare(`
            SELECT
                (SELECT COUNT(*) FROM files f
                    JOIN subjects s ON f.subject_id = s.id
                    WHERE s.semester_id = ?) +
                (SELECT COUNT(*) FROM imported_folder_files iff
                    JOIN imported_folders imf ON iff.imported_folder_id = imf.id
                    JOIN subjects s ON imf.subject_id = s.id
                    WHERE s.semester_id = ?) AS count
        `).get(semester_id, semester_id) as { count: number }
        return row.count
    })
}

function fetch_file_count_by_year() {
    ipcMain.handle("files:getCountByYear", (_event, year_id: number) => {
        const row = database.prepare(`
            SELECT
                (SELECT COUNT(*) FROM files f
                    JOIN subjects s ON f.subject_id = s.id
                    JOIN semesters sem ON s.semester_id = sem.id
                    WHERE sem.year_id = ?) +
                (SELECT COUNT(*) FROM imported_folder_files iff
                    JOIN imported_folders imf ON iff.imported_folder_id = imf.id
                    JOIN subjects s ON imf.subject_id = s.id
                    JOIN semesters sem ON s.semester_id = sem.id
                    WHERE sem.year_id = ?) AS count
        `).get(year_id, year_id) as { count: number }
        return row.count
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

function mark_file_opened() {
    ipcMain.handle("files:markOpened", (_event, file_id: number) => {
        database.prepare(`
            INSERT INTO file_opens (file_id, opened_at) VALUES (?, datetime('now'))
            ON CONFLICT(file_id) DO UPDATE SET opened_at = datetime('now')
        `).run(file_id)
    })
}

function fetch_recent_files_by_subject() {
    ipcMain.handle("files:getRecentBySubject", (_event, subject_id: number, limit: number) => {
        const rows = database.prepare(`
            SELECT f.*, s.name AS subject_name, fo.opened_at
            FROM file_opens fo
            JOIN files f ON f.id = fo.file_id
            JOIN subjects s ON s.id = f.subject_id
            WHERE f.subject_id = ?
            ORDER BY fo.opened_at DESC
            LIMIT ?
        `).all(subject_id, limit) as { file_path: string }[]
        return with_exists(rows)
    })
}

function fetch_recent_files_by_semester() {
    ipcMain.handle("files:getRecentBySemester", (_event, semester_id: number, limit: number) => {
        const rows = database.prepare(`
            SELECT f.*, s.name AS subject_name, fo.opened_at
            FROM file_opens fo
            JOIN files f ON f.id = fo.file_id
            JOIN subjects s ON s.id = f.subject_id
            WHERE s.semester_id = ?
            ORDER BY fo.opened_at DESC
            LIMIT ?
        `).all(semester_id, limit) as { file_path: string }[]
        return with_exists(rows)
    })
}

function fetch_recent_files_by_year() {
    ipcMain.handle("files:getRecentByYear", (_event, year_id: number, limit: number) => {
        const rows = database.prepare(`
            SELECT f.*, s.name AS subject_name, fo.opened_at
            FROM file_opens fo
            JOIN files f ON f.id = fo.file_id
            JOIN subjects s ON s.id = f.subject_id
            JOIN semesters sem ON sem.id = s.semester_id
            WHERE sem.year_id = ?
            ORDER BY fo.opened_at DESC
            LIMIT ?
        `).all(year_id, limit) as { file_path: string }[]
        return with_exists(rows)
    })
}

function fetch_file_type_count_by_semester() {
    ipcMain.handle("files:getTypeCountBySemester", (_event, semester_id: number, file_type: string) => {
        const row = database.prepare(`
            SELECT COUNT(*) AS count
            FROM files f
            JOIN subjects s ON s.id = f.subject_id
            WHERE s.semester_id = ? AND f.file_type = ?
        `).get(semester_id, file_type) as { count: number }
        return row.count
    })
}

function search_files() {
    ipcMain.handle("files:search", (_event, query: string) => {
        const like = `%${query}%`
        return database.prepare(`
            SELECT
                f.id, f.file_name, f.file_path, f.file_type, 'virtual' AS kind,
                f.folder_id, vf.name AS folder_name,
                s.id AS subject_id, s.name AS subject_name,
                sem.id AS semester_id, sem.name AS semester_name,
                sem.start_date AS semester_start_date, sem.end_date AS semester_end_date,
                y.id AS year_id, y.name AS year_name,
                y.start_date AS year_start_date, y.end_date AS year_end_date
            FROM files f
            JOIN subjects s ON s.id = f.subject_id
            JOIN semesters sem ON sem.id = s.semester_id
            JOIN academic_years y ON y.id = sem.year_id
            LEFT JOIN virtual_folders vf ON vf.id = f.folder_id
            WHERE f.file_name LIKE ? COLLATE NOCASE

            UNION ALL

            SELECT
                iff.id, iff.file_name, iff.file_path, iff.file_type, 'imported' AS kind,
                imf.id AS folder_id, imf.name AS folder_name,
                s.id AS subject_id, s.name AS subject_name,
                sem.id AS semester_id, sem.name AS semester_name,
                sem.start_date AS semester_start_date, sem.end_date AS semester_end_date,
                y.id AS year_id, y.name AS year_name,
                y.start_date AS year_start_date, y.end_date AS year_end_date
            FROM imported_folder_files iff
            JOIN imported_folders imf ON imf.id = iff.imported_folder_id
            JOIN subjects s ON s.id = imf.subject_id
            JOIN semesters sem ON sem.id = s.semester_id
            JOIN academic_years y ON y.id = sem.year_id
            WHERE iff.file_name LIKE ? COLLATE NOCASE

            ORDER BY file_name
            LIMIT 40
        `).all(like, like)
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
    update_file_category()
    delete_file()
    delete_files_by_subject()
    fetch_file_count_by_semester()
    fetch_file_count_by_year()
    open_file_picker()
    pick_single_file()
    search_files()
    read_file_buffer()
    open_file()
    mark_file_opened()
    fetch_recent_files_by_subject()
    fetch_recent_files_by_semester()
    fetch_recent_files_by_year()
    fetch_file_type_count_by_semester()
}
