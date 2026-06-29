import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { readFileBuffer, type AppFile } from "@/components/file_service/file"

const IMAGE_TYPES = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"])
const VIDEO_TYPES = new Set(["mp4", "mov", "avi", "mkv", "webm"])

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", bmp: "image/bmp",
  mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
  mkv: "video/x-matroska", webm: "video/webm",
}

function getExt(file: AppFile): string {
  const dot = file.file_name.lastIndexOf(".")
  return dot !== -1 ? file.file_name.slice(dot + 1).toLowerCase() : file.file_type.toLowerCase()
}

export function canPreview(file: AppFile): boolean {
  const ext = getExt(file)
  return IMAGE_TYPES.has(ext) || VIDEO_TYPES.has(ext)
}

interface Props {
  file: AppFile | null
  onClose: () => void
}

export function FilePreviewModal({ file, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    if (!file) return

    let cancelled = false
    setLoading(true)
    const ext = getExt(file)
    readFileBuffer(file.file_path)
      .then(buf => {
        if (cancelled) return
        const blob = new Blob([buf], { type: MIME[ext] ?? "application/octet-stream" })
        setBlobUrl(URL.createObjectURL(blob))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [file?.id])

  useEffect(() => {
    return () => { setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null }) }
  }, [])

  if (!file) return null

  const ext = getExt(file)
  const isVideo = VIDEO_TYPES.has(ext)

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: "min(92vw, 1120px)", height: "min(90vh, 880px)",
        background: "var(--background)", borderRadius: 16,
        border: "1px solid var(--border)", display: "flex", flexDirection: "column",
        overflow: "hidden", boxShadow: "0 32px 64px rgba(0,0,0,0.45)",
      }}>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span style={{
              background: "var(--muted)", color: "var(--muted-foreground)", fontSize: 10,
              padding: "2px 8px", borderRadius: 6, border: "1px solid var(--border)",
              textTransform: "uppercase", flexShrink: 0,
            }}>
              {file.file_type || ext || "—"}
            </span>
            <span style={{
              fontSize: 14, fontWeight: 500, color: "var(--foreground)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {file.file_name}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, borderRadius: 8, display: "flex",
              color: "var(--muted-foreground)", flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{
          flex: 1, minHeight: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: isVideo ? "#000" : undefined,
        }}>
          {loading && (
            <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Loading…</span>
          )}
          {!loading && blobUrl && isVideo && (
            <video src={blobUrl} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
          )}
          {!loading && blobUrl && !isVideo && (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 32, overflow: "auto",
            }}>
              <img
                src={blobUrl}
                alt={file.file_name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }}
              />
            </div>
          )}
          {!loading && !blobUrl && (
            <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Could not load file.</span>
          )}
        </div>

      </div>
    </div>
  )
}
