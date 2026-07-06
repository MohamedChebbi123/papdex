import { useEffect, useState } from "react"
import {
  FileImage, FileVideo, FileAudio, FileArchive, FileSpreadsheet,
  FileCode, FileJson, FileText, File as FileGeneric,
} from "lucide-react"
import { readFileBuffer } from "@/components/file_service/file"

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"])
const VIDEO_EXT = new Set(["mp4", "mov", "avi", "mkv", "webm"])
const AUDIO_EXT = new Set(["mp3", "wav", "flac", "ogg", "m4a", "aac"])
const ARCHIVE_EXT = new Set(["zip", "rar", "7z", "tar", "gz"])
const SPREADSHEET_EXT = new Set(["xls", "xlsx", "csv"])
const JSON_EXT = new Set(["json"])
const MARKDOWN_EXT = new Set(["md", "mdx", "txt"])
const CODE_EXT = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs", "py", "java", "c", "h", "cpp", "cc",
  "cs", "go", "rs", "rb", "php", "swift", "kt", "html", "htm", "css", "scss",
  "sh", "bash", "sql", "yml", "yaml", "xml",
])

const IMAGE_MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
}

function getExt(fileName: string, fileType: string): string {
  const dot = fileName.lastIndexOf(".")
  return dot !== -1 ? fileName.slice(dot + 1).toLowerCase() : fileType.toLowerCase()
}

export interface FileTypeIconProps {
  fileName: string
  fileType: string
  filePath: string
  size?: number
}

export function FileTypeIcon({ fileName, fileType, filePath, size = 16 }: FileTypeIconProps) {
  const ext = getExt(fileName, fileType)
  const isImage = IMAGE_EXT.has(ext)
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!isImage) return
    let cancelled = false
    let url: string | null = null

    readFileBuffer(filePath)
      .then(buf => {
        if (cancelled) return
        const blob = new Blob([new Uint8Array(buf.buffer as ArrayBuffer)], { type: IMAGE_MIME[ext] ?? "image/png" })
        url = URL.createObjectURL(blob)
        setThumbUrl(url)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [isImage, filePath, ext])

  const style = { flexShrink: 0 }

  if (isImage) {
    if (thumbUrl) {
      return (
        <img
          src={thumbUrl}
          alt=""
          style={{ width: size, height: size, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
        />
      )
    }
    return <FileImage size={size} color="#8b5cf6" style={style} />
  }
  if (VIDEO_EXT.has(ext)) return <FileVideo size={size} color="#ec4899" style={style} />
  if (ext === "pdf") return <FileText size={size} color="#dc2626" style={style} />
  if (JSON_EXT.has(ext)) return <FileJson size={size} color="#0891b2" style={style} />
  if (CODE_EXT.has(ext)) return <FileCode size={size} color="#2563eb" style={style} />
  if (AUDIO_EXT.has(ext)) return <FileAudio size={size} color="#059669" style={style} />
  if (ARCHIVE_EXT.has(ext)) return <FileArchive size={size} color="#b45309" style={style} />
  if (SPREADSHEET_EXT.has(ext)) return <FileSpreadsheet size={size} color="#0d9488" style={style} />
  if (MARKDOWN_EXT.has(ext)) return <FileText size={size} color="var(--muted-foreground)" style={style} />
  return <FileGeneric size={size} color="var(--muted-foreground)" style={style} />
}
