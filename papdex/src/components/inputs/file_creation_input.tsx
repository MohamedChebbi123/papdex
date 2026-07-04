import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, UploadCloud, X } from "lucide-react"
import { createFile } from "@/components/file_service/file"
import { categoryLabel } from "@/lib/category_label"

const QUICK_TYPES = ["Summary", "Lesson", "Quiz", "Exam", "Video", "Notes", "Exercise", "TD", "TP"] 

interface PickedFile {
  name: string
  path: string
  ext: string
  size: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectId: number
  folderId: number | null
  onCreated?: (file: { id: number; file_name: string; file_path: string; file_type: string; file_size: number }) => void
}

export function FileCreationInput({ open, onOpenChange, subjectId, folderId, onCreated }: Props) {
  const { t } = useTranslation()
  const [picked, setPicked] = useState<PickedFile | null>(null)
  const [fileType, setFileType] = useState("")
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function readFile(file: File) {
    const f = file as File & { path: string }
    const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
    setPicked({ name: f.name, path: f.path, ext, size: f.size })
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!picked || !fileType.trim()) return
    setLoading(true)
    try {
      const id = await createFile(subjectId, folderId, picked.name, picked.path, fileType.trim(), picked.size)
      onCreated?.({ id, file_name: picked.name, file_path: picked.path, file_type: fileType.trim(), file_size: picked.size })
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    onOpenChange(false)
    setPicked(null)
    setFileType("")
  }

  return (
    <Dialog.Root open={open} onOpenChange={open => { if (!open) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-xl transition-all duration-150 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
            <div className="p-6">
              <Dialog.Title className="text-base font-semibold">{t("modal.fileCreate.title")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("modal.fileCreate.description")}
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">

                {/* Drop zone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("modal.fileCreate.fileLabel")}</label>

                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    onChange={handleInputChange}
                  />

                  {picked ? (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                      <FileText className="size-5 flex-shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{picked.name}</p>
                        <p className="text-xs text-muted-foreground uppercase">{picked.ext} · {(picked.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPicked(null)}
                        className="flex-shrink-0 rounded p-1 hover:bg-accent transition-colors"
                      >
                        <X className="size-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => inputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragging(true) }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 cursor-pointer transition-colors"
                      style={{
                        borderColor: dragging ? "var(--primary)" : "var(--border)",
                        background: dragging ? "var(--accent)" : "transparent",
                      }}
                    >
                      <UploadCloud className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        {t("modal.fileCreate.dropText")} <span className="text-foreground font-medium">{t("modal.fileCreate.clickToBrowse")}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("modal.fileCreate.typeLabel")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TYPES.map(qt => (
                      <button
                        key={qt}
                        type="button"
                        onClick={() => setFileType(qt)}
                        className="rounded-md border px-2.5 py-1 text-xs transition-colors"
                        style={{
                          background:   fileType === qt ? "var(--primary)"            : "var(--muted)",
                          color:        fileType === qt ? "var(--primary-foreground)"  : "var(--muted-foreground)",
                          borderColor:  fileType === qt ? "var(--primary)"             : "var(--border)",
                        }}
                      >
                        {categoryLabel(t, qt)}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={fileType}
                    onChange={e => setFileType(e.target.value)}
                    placeholder={t("modal.fileCreate.customTypePlaceholder")}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={!picked || !fileType.trim() || loading}>
                    {loading ? t("modal.fileCreate.adding") : t("modal.fileCreate.addFile")}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
