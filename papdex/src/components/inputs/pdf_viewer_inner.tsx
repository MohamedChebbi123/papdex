import { useState, useEffect } from "react"
import { readFileBuffer } from "@/components/file_service/file"

export default function PdfViewerInner({ filePath }: { filePath: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let url: string | null = null
    setError(null)
    setPdfUrl(null)

    readFileBuffer(filePath)
      .then(buf => {
        const blob = new Blob([new Uint8Array(buf)], { type: "application/pdf" })
        url = URL.createObjectURL(blob)
        setPdfUrl(url)
      })
      .catch(() => setError("Could not read file."))

    return () => { if (url) URL.revokeObjectURL(url) }
  }, [filePath])

  if (error) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
      {error}
    </div>
  )

  if (!pdfUrl) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
      Loading…
    </div>
  )

  return (
    <iframe
      src={pdfUrl}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
      title="PDF Viewer"
    />
  )
}
