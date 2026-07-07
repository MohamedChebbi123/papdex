import { ipcMain, shell } from "electron"

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

function open_external() {
    ipcMain.handle("shell:openExternal", async (_event, url: string) => {
        let parsed: URL
        try {
            parsed = new URL(url)
        } catch {
            throw new Error("Invalid URL.")
        }
        if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
            throw new Error(`Refusing to open unsupported link protocol: ${parsed.protocol}`)
        }
        await shell.openExternal(parsed.toString())
    })
}

export function shell_handlers() {
    open_external()
}
