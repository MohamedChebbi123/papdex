import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog } from "@base-ui/react/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateFile, type AppFile } from "@/components/file_service/file"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: AppFile | null
  onRenamed?: (name: string) => void
}

function splitExtension(fileName: string): { base: string; ext: string } {
  const dotIndex = fileName.lastIndexOf(".")
  if (dotIndex <= 0) return { base: fileName, ext: "" }
  return { base: fileName.slice(0, dotIndex), ext: fileName.slice(dotIndex + 1) }
}

export function FileRename({ open, onOpenChange, file, onRenamed }: Props) {
  const { t } = useTranslation()
  const [base, setBase] = useState("")
  const [ext, setExt] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file) return
    const split = splitExtension(file.file_name)
    setBase(split.base)
    setExt(split.ext)
  }, [file])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const newName = ext ? `${base}.${ext}` : base
    setLoading(true)
    try {
      await updateFile(file.id, newName, file.folder_id)
      onRenamed?.(newName)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border bg-background shadow-xl transition-all duration-150 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
            <div className="p-6">
              <Dialog.Title className="text-base font-semibold">{t("modal.fileRename.title")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("modal.fileRename.description")}
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.name")}</label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={base}
                      onChange={e => setBase(e.target.value)}
                      required
                      autoFocus
                      className="flex-1"
                    />
                    {ext && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">.{ext}</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Dialog.Close render={<Button type="button" variant="outline" />}>
                    {t("common.cancel")}
                  </Dialog.Close>
                  <Button type="submit" disabled={loading}>
                    {loading ? t("common.saving") : t("common.save")}
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
