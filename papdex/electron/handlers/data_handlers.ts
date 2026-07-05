import { ipcMain, dialog, app } from "electron"
import { createRequire } from "node:module"
import fs from "node:fs"
import database, { database_path } from "../database/connection"

const require = createRequire(import.meta.url)
const Database = require("better-sqlite3")

function delete_all_data() {
    ipcMain.handle("data:deleteAll", () => {
        const run = database.transaction(() => {
            database.prepare("DELETE FROM file_opens").run()
            database.prepare("DELETE FROM imported_file_opens").run()
            database.prepare("DELETE FROM files").run()
            database.prepare("DELETE FROM imported_folder_files").run()
            database.prepare("DELETE FROM virtual_folders").run()
            database.prepare("DELETE FROM imported_folders").run()
            database.prepare("DELETE FROM subjects").run()
            database.prepare("DELETE FROM semesters").run()
            database.prepare("DELETE FROM academic_years").run()
        })
        run()
    })
}

function export_backup() {
    ipcMain.handle("data:exportBackup", async () => {
        const { filePath, canceled } = await dialog.showSaveDialog({
            defaultPath: `Papdex-backup-${new Date().toISOString().slice(0, 10)}.db`,
            filters: [{ name: "Papdex Backup", extensions: ["db"] }],
        })
        if (canceled || !filePath) return null

        await database.backup(filePath)
        return filePath
    })
}

function restore_backup() {
    ipcMain.handle("data:restoreBackup", async () => {
        const { filePaths, canceled } = await dialog.showOpenDialog({
            properties: ["openFile"],
            filters: [{ name: "Papdex Backup", extensions: ["db"] }],
        })
        if (canceled || filePaths.length === 0) return false

        const backup_path = filePaths[0]

        const check = new Database(backup_path, { readonly: true })
        const is_valid = check.prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'academic_years'"
        ).get()
        check.close()
        if (!is_valid) throw new Error("Selected file is not a valid Papdex backup.")

        database.close()
        fs.copyFileSync(backup_path, database_path)
        for (const ext of ["-wal", "-shm"]) {
            const sidecar = database_path + ext
            if (fs.existsSync(sidecar)) fs.rmSync(sidecar)
        }

        app.relaunch()
        app.exit()
        return true
    })
}

export function data_handlers() {
    delete_all_data()
    export_backup()
    restore_backup()
}
