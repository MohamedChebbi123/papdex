import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog } from "@base-ui/react/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateVirtualFolder } from "@/components/virtual_folders_service/file"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: { id: number; name: string } | null
  onUpdated?: () => void
}

export function VirtualFolderUpdate({ open, onOpenChange, folder, onUpdated }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (folder) setName(folder.name)
  }, [folder])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!folder) return
    setLoading(true)
    try {
      await updateVirtualFolder(folder.id, name)
      onUpdated?.()
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
              <Dialog.Title className="text-base font-semibold">{t("modal.folderUpdate.title")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("modal.folderUpdate.description")}
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.name")}</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t("modal.folderCreate.namePlaceholder")}
                    required
                    autoFocus
                  />
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
