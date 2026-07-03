import type { ExtractedPage } from "./document_extractor"

export interface DocumentChunk {
    content: string
    /** 0-based order of this chunk within the document. */
    position: number
    /** 1-based page number for paginated formats (PDF), null otherwise. */
    page: number | null
}

// Rough English-text heuristic (no tokenizer dependency): ~4 characters per token.
// Kept under bge-small-en-v1.5's 512-token context window (with headroom), since
// that's the embedding model these chunks get fed into.
const CHARS_PER_TOKEN = 4
const CHUNK_TOKENS = 400
const OVERLAP_TOKENS = 50
const CHUNK_CHARS = CHUNK_TOKENS * CHARS_PER_TOKEN
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN

function splitOversizedParagraph(paragraph: string): string[] {
    const windows: string[] = []
    let remaining = paragraph
    while (remaining.length > CHUNK_CHARS) {
        let cut = remaining.lastIndexOf(" ", CHUNK_CHARS)
        if (cut <= 0) cut = CHUNK_CHARS
        windows.push(remaining.slice(0, cut).trim())
        remaining = remaining.slice(Math.max(cut - OVERLAP_CHARS, 0)).trimStart()
    }
    if (remaining) windows.push(remaining)
    return windows
}

function splitIntoWindows(text: string): string[] {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    const windows: string[] = []
    let current = ""

    for (const paragraph of paragraphs) {
        if (paragraph.length > CHUNK_CHARS) {
            if (current) {
                windows.push(current)
                current = ""
            }
            windows.push(...splitOversizedParagraph(paragraph))
            continue
        }

        const candidate = current ? `${current}\n\n${paragraph}` : paragraph
        if (candidate.length > CHUNK_CHARS) {
            windows.push(current)
            const overlap = current.slice(-OVERLAP_CHARS)
            current = overlap ? `${overlap}\n\n${paragraph}` : paragraph
        } else {
            current = candidate
        }
    }
    if (current) windows.push(current)

    return windows
}

export function chunkPages(pages: ExtractedPage[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    let position = 0

    for (const p of pages) {
        for (const content of splitIntoWindows(p.text)) {
            chunks.push({ content, position: position++, page: p.page })
        }
    }

    return chunks
}
