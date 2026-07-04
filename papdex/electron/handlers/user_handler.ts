import { ipcMain, dialog, BrowserWindow } from "electron"
import database from "../database/connection"

function get_user() {
    ipcMain.handle("user:get", () => {
        return database.prepare("SELECT * FROM user WHERE id = 1").get()
    })
}

function update_user() {
    ipcMain.handle("user:update", (_event, fields: { display_name?: string; avatar_path?: string; theme?: string; onboarded?: number; language?: string }) => {
        const sets: string[] = []
        const values: unknown[] = []

        if (fields.display_name !== undefined) { sets.push("display_name = ?"); values.push(fields.display_name) }
        if (fields.avatar_path  !== undefined) { sets.push("avatar_path = ?");  values.push(fields.avatar_path) }
        if (fields.theme        !== undefined) { sets.push("theme = ?");        values.push(fields.theme) }
        if (fields.onboarded    !== undefined) { sets.push("onboarded = ?");    values.push(fields.onboarded) }
        if (fields.language     !== undefined) { sets.push("language = ?");     values.push(fields.language) }

        if (sets.length === 0) return 0

        return database.prepare(`UPDATE user SET ${sets.join(", ")} WHERE id = 1`).run(...values).changes
    })
}

function pick_avatar() {
    ipcMain.handle("user:pickAvatar", async (event) => {
        const win = BrowserWindow.fromWebContents(event.sender)
        const result = await dialog.showOpenDialog(win!, {
            title: "Choose a profile picture",
            filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "webp", "gif"] }],
            properties: ["openFile"],
        })
        if (result.canceled || result.filePaths.length === 0) return null
        const filePath = result.filePaths[0]
        const { readFileSync } = await import("fs")
        const ext = filePath.split(".").pop()?.toLowerCase() ?? "jpeg"
        const mime = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg"
        const data = readFileSync(filePath).toString("base64")
        return `data:${mime};base64,${data}`
    })
}

export function user_handlers() {
    get_user()
    update_user()
    pick_avatar()
}
