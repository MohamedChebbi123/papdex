import { ipcMain } from "electron"
import database from "../database/connection"

function get_user() {
    ipcMain.handle("user:get", () => {
        return database.prepare("SELECT * FROM user WHERE id = 1").get()
    })
}

function update_user() {
    ipcMain.handle("user:update", (_event, fields: { display_name?: string; avatar_path?: string; theme?: string }) => {
        const sets: string[] = []
        const values: unknown[] = []

        if (fields.display_name !== undefined) { sets.push("display_name = ?"); values.push(fields.display_name) }
        if (fields.avatar_path  !== undefined) { sets.push("avatar_path = ?");  values.push(fields.avatar_path) }
        if (fields.theme        !== undefined) { sets.push("theme = ?");        values.push(fields.theme) }

        if (sets.length === 0) return 0

        return database.prepare(`UPDATE user SET ${sets.join(", ")} WHERE id = 1`).run(...values).changes
    })
}

export function user_handlers() {
    get_user()
    update_user()
}
