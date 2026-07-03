import fs from "node:fs/promises"

const TEXT_EXTENSIONS = new Set([
    "txt", "log", "md", "mdx", "csv",
    "json", "yaml", "yml", "toml", "xml", "html", "htm",
    "css", "scss", "less",
    "js", "mjs", "cjs", "ts", "mts", "cts", "tsx", "jsx",
    "py", "rb", "java", "c", "h", "cpp", "cc", "cxx", "hpp",
    "cs", "go", "rs", "swift", "kt", "php", "r", "sql",
    "sh", "bash", "zsh", "ps1",
])

export interface ExtractedPage {
    /** 1-based page number for paginated formats (PDF), null otherwise. */
    page: number | null
    text: string
}

export async function extractPages(file_path: string, file_type: string): Promise<ExtractedPage[] | null> {
    const ext = file_type.toLowerCase()

    if (ext === "pdf") {
        const { PDFParse } = await import("pdf-parse")
        const buffer = await fs.readFile(file_path)
        const parser = new PDFParse({ data: buffer })
        try {
            const result = await parser.getText()
            return result.pages.map(p => ({ page: p.num, text: p.text }))
        } finally {
            await parser.destroy()
        }
    }

    if (TEXT_EXTENSIONS.has(ext)) {
        const text = await fs.readFile(file_path, "utf-8")
        return [{ page: null, text }]
    }

    return null
}

export async function extractText(file_path: string, file_type: string): Promise<string | null> {
    const pages = await extractPages(file_path, file_type)
    if (!pages) return null
    return pages.map(p => p.text).join("\n\n")
}
