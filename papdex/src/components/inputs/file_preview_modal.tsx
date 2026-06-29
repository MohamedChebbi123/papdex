import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { readFileBuffer, type AppFile } from "@/components/file_service/file"
import type { Highlighter } from "shiki"
import PdfViewerInner from "@/components/inputs/pdf_viewer_inner"

const IMAGE_TYPES = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"])
const VIDEO_TYPES = new Set(["mp4", "mov", "avi", "mkv", "webm"])

const EXT_TO_LANG: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", mts: "typescript", cts: "typescript",
  jsx: "jsx", tsx: "tsx",
  py: "python", pyw: "python",
  rb: "ruby", rbw: "ruby",
  java: "java",
  c: "c", h: "c",
  cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", hxx: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  swift: "swift",
  kt: "kotlin", kts: "kotlin",
  php: "php",
  r: "r",
  scala: "scala",
  dart: "dart",
  lua: "lua",
  pl: "perl", pm: "perl",
  hs: "haskell",
  ex: "elixir", exs: "elixir",
  erl: "erlang", hrl: "erlang",
  html: "html", htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  json: "json",
  yaml: "yaml", yml: "yaml",
  toml: "toml",
  xml: "xml",
  svg: "xml",
  md: "markdown", mdx: "markdown",
  sql: "sql",
  sh: "bash", bash: "bash", zsh: "bash",
  ps1: "powershell", psm1: "powershell",
  dockerfile: "dockerfile",
  vue: "vue",
  svelte: "svelte",
  graphql: "graphql", gql: "graphql",
  tf: "hcl", hcl: "hcl",
  ini: "ini", cfg: "ini",
  makefile: "makefile",
  zig: "zig",
  nim: "nim",
  v: "v",
  txt: "text", log: "text",
}

const CODE_TYPES = new Set(Object.keys(EXT_TO_LANG))

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({ themes: ["github-dark"], langs: [] })
    )
  }
  return highlighterPromise
}

function CodeViewer({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string>("")
  const abortRef = useRef(false)

  useEffect(() => {
    abortRef.current = false
    setHtml("")
    getHighlighter().then(async (hl) => {
      if (abortRef.current) return
      try {
        await hl.loadLanguage(lang as never)
      } catch {
        // unsupported lang, fall back to plain text
      }
      if (abortRef.current) return
      const safeLang = hl.getLoadedLanguages().includes(lang as never) ? lang : "text"
      const out = hl.codeToHtml(code, { lang: safeLang, theme: "github-dark" })
      setHtml(out)
    })
    return () => { abortRef.current = true }
  }, [code, lang])

  if (!html) return (
    <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Highlighting…</span>
  )

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ width: "100%", height: "100%", overflow: "auto" }}
    />
  )
}

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
  return IMAGE_TYPES.has(ext) || VIDEO_TYPES.has(ext) || CODE_TYPES.has(ext) || ext === "pdf"
}

interface Props {
  file: AppFile | null
  onClose: () => void
}

export function FilePreviewModal({ file, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [codeText, setCodeText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const ext = file ? getExt(file) : ""
  const isCode = CODE_TYPES.has(ext)
  const isVideo = VIDEO_TYPES.has(ext)
  const isPdf = ext === "pdf"

  useEffect(() => {
    setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    setCodeText(null)
    if (!file || isPdf) return

    let cancelled = false
    setLoading(true)

    readFileBuffer(file.file_path)
      .then(buf => {
        if (cancelled) return
        if (isCode) {
          setCodeText(new TextDecoder().decode(buf))
        } else {
          const blob = new Blob([new Uint8Array(buf.buffer as ArrayBuffer)], {
            type: MIME[ext] ?? "application/octet-stream",
          })
          setBlobUrl(URL.createObjectURL(blob))
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [file?.id])

  useEffect(() => {
    return () => { setBlobUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null }) }
  }, [])

  if (!file) return null

  const lang = EXT_TO_LANG[ext] ?? "text"

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
          background: isVideo ? "#000" : isCode ? "#0d1117" : undefined,
          position: "relative",
        }}>
          {isPdf && (
            <PdfViewerInner filePath={file.file_path} />
          )}
          {!isPdf && loading && (
            <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Loading…</span>
          )}
          {!isPdf && !loading && isCode && codeText !== null && (
            <CodeViewer code={codeText} lang={lang} />
          )}
          {!isPdf && !loading && !isCode && blobUrl && isVideo && (
            <video src={blobUrl} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
          )}
          {!isPdf && !loading && !isCode && blobUrl && !isVideo && (
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
          {!isPdf && !loading && !isCode && !blobUrl && (
            <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>Could not load file.</span>
          )}
        </div>

      </div>
    </div>
  )
}
