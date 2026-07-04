import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import { updateFile, type AppFile } from "@/components/file_service/file"
import { getVirtualFoldersBySubject } from "@/components/virtual_folders_service/file"

interface VirtualFolder {
  id: number
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: AppFile | null
  subjectId: number
  onMoved?: (folderId: number) => void
}

export function FileMove({ open, onOpenChange, file, subjectId, onMoved }: Props) {
  const { t } = useTranslation()
  const [folders, setFolders] = useState<VirtualFolder[]>([])
  const [folderId, setFolderId] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    getVirtualFoldersBySubject(subjectId).then(setFolders)
  }, [open, subjectId])

  useEffect(() => {
    if (file) setFolderId(String(file.folder_id ?? ""))
  }, [file])

  const otherFolders = folders.filter(f => f.id !== file?.folder_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || folderId === "") return
    setLoading(true)
    try {
      const targetId = Number(folderId)
      await updateFile(file.id, file.file_name, targetId)
      onMoved?.(targetId)
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
              <Dialog.Title className="text-base font-semibold">{t("modal.fileMove.title")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("modal.fileMove.description")}
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("modal.fileMove.folderLabel")}</label>
                  {otherFolders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("modal.fileMove.noOtherFolders")}</p>
                  ) : (
                    <select
                      value={folderId}
                      onChange={e => setFolderId(e.target.value)}
                      required
                      autoFocus
                      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                    >
                      <option value="" disabled>{t("modal.fileMove.selectPlaceholder")}</option>
                      {otherFolders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Dialog.Close render={<Button type="button" variant="outline" />}>
                    {t("common.cancel")}
                  </Dialog.Close>
                  <Button type="submit" disabled={loading || otherFolders.length === 0}>
                    {loading ? t("common.saving") : t("modal.fileMove.move")}
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
