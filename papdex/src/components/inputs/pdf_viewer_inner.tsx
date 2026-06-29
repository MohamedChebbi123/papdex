import { useState, useEffect } from "react"
import { Worker, Viewer } from "@react-pdf-viewer/core"
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout"
import "@react-pdf-viewer/core/lib/styles/index.css"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"
import { readFileBuffer } from "@/components/file_service/file"

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.js?url"

export default function PdfViewerInner({ filePath }: { filePath: string }) {
  const [defaultLayout] = useState(() => defaultLayoutPlugin())
  const [data, setData] = useState<Uint8Array | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(null)
    readFileBuffer(filePath)
      .then(setData)
      .catch(() => setError("Could not read file."))
  }, [filePath])

  if (error) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
      {error}
    </div>
  )

  if (!data) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
      Loading…
    </div>
  )

  return (
    <Worker workerUrl={pdfWorkerUrl}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Viewer fileUrl={data} plugins={[defaultLayout]} />
      </div>
    </Worker>
  )
}
