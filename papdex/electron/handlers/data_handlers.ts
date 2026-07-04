import { ipcMain } from "electron"
import database from "../database/connection"

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

export function data_handlers() {
    delete_all_data()
}
