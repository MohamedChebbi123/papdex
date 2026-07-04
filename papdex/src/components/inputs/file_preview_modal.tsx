import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { readFileBuffer, type AppFile } from "@/components/file_service/file"
import type { Highlighter } from "shiki"
import PdfViewerInner from "@/components/inputs/pdf_viewer_inner"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
const MARKDOWN_TYPES = new Set(["md", "mdx"])

function MarkdownViewer({ content }: { content: string }) {
  return (
    <div style={{
      width: "100%", height: "100%", overflow: "auto",
      padding: "32px 48px", color: "var(--foreground)",
      fontFamily: "inherit", fontSize: 15, lineHeight: 1.7,
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 16px", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: 22, fontWeight: 600, margin: "28px 0 12px" }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: 18, fontWeight: 600, margin: "24px 0 8px" }}>{children}</h3>,
            h4: ({ children }) => <h4 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 6px" }}>{children}</h4>,
            p: ({ children }) => <p style={{ margin: "0 0 14px" }}>{children}</p>,
            a: ({ href, children }) => <a href={href} style={{ color: "var(--primary)", textDecoration: "underline" }}>{children}</a>,
            ul: ({ children }) => <ul style={{ margin: "0 0 14px", paddingInlineStart: 24 }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ margin: "0 0 14px", paddingInlineStart: 24 }}>{children}</ol>,
            li: ({ children }) => <li style={{ margin: "4px 0" }}>{children}</li>,
            blockquote: ({ children }) => <blockquote style={{ borderInlineStart: "3px solid var(--border)", margin: "0 0 14px", paddingInlineStart: 16, color: "var(--muted-foreground)" }}>{children}</blockquote>,
            code: ({ children, className }) => {
              const isBlock = !!className
              return isBlock
                ? <code style={{ display: "block", background: "var(--muted)", borderRadius: 8, padding: "12px 16px", fontSize: 13, overflowX: "auto", margin: "0 0 14px", fontFamily: "monospace" }}>{children}</code>
                : <code style={{ background: "var(--muted)", borderRadius: 4, padding: "2px 6px", fontSize: 13, fontFamily: "monospace" }}>{children}</code>
            },
            pre: ({ children }) => <pre style={{ margin: 0 }}>{children}</pre>,
            hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "24px 0" }} />,
            table: ({ children }) => <div style={{ overflowX: "auto", margin: "0 0 14px" }}><table style={{ borderCollapse: "collapse", width: "100%" }}>{children}</table></div>,
            th: ({ children }) => <th style={{ border: "1px solid var(--border)", padding: "8px 12px", background: "var(--muted)", fontWeight: 600, textAlign: "start" }}>{children}</th>,
            td: ({ children }) => <td style={{ border: "1px solid var(--border)", padding: "8px 12px" }}>{children}</td>,
            img: ({ src, alt }) => <img src={src} alt={alt} style={{ maxWidth: "100%", borderRadius: 8, margin: "8px 0" }} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

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
  const { t } = useTranslation()
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
    <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{t("filePreview.highlighting")}</span>
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
  return IMAGE_TYPES.has(ext) || VIDEO_TYPES.has(ext) || CODE_TYPES.has(ext) || MARKDOWN_TYPES.has(ext) || ext === "pdf"
}

interface Props {
  file: AppFile | null
  onClose: () => void
}

export function FilePreviewPanel({ file, onClose }: Props) {
  const { t } = useTranslation()
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [codeText, setCodeText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const ext = file ? getExt(file) : ""
  const isCode = CODE_TYPES.has(ext)
  const isMarkdown = MARKDOWN_TYPES.has(ext)
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
        if (isCode || isMarkdown) {
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
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: "var(--background)", borderInlineStart: "1px solid var(--border)",
    }}>
      {/* Header */}
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

      {/* Content */}
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
          <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{t("common.loading")}</span>
        )}
        {!isPdf && !loading && isMarkdown && codeText !== null && (
          <MarkdownViewer content={codeText} />
        )}
        {!isPdf && !loading && isCode && codeText !== null && (
          <CodeViewer code={codeText} lang={lang} />
        )}
        {!isPdf && !loading && !isCode && !isMarkdown && blobUrl && isVideo && (
          <video src={blobUrl} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
        )}
        {!isPdf && !loading && !isCode && !isMarkdown && blobUrl && !isVideo && (
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
        {!isPdf && !loading && !isCode && !isMarkdown && !blobUrl && (
          <span style={{ color: "var(--muted-foreground)", fontSize: 13 }}>{t("filePreview.couldNotLoad")}</span>
        )}
      </div>
    </div>
  )
}
