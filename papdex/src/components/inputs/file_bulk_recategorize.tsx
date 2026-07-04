import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog } from "@base-ui/react/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateFileCategory } from "@/components/file_service/file"
import { categoryLabel } from "@/lib/category_label"

const QUICK_TYPES = ["Summary", "Lesson", "Quiz", "Exam", "Video", "Notes", "Exercise", "TD", "TP"]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileIds: number[]
  onRecategorized?: (category: string) => void
}

export function FileBulkRecategorize({ open, onOpenChange, fileIds, onRecategorized }: Props) {
  const { t } = useTranslation()
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setCategory("")
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fileIds.length === 0 || !category.trim()) return
    setLoading(true)
    try {
      const value = category.trim()
      await Promise.all(fileIds.map(id => updateFileCategory(id, value)))
      onRecategorized?.(value)
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
              <Dialog.Title className="text-base font-semibold">{t("modal.fileBulkRecategorize.title")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("modal.fileBulkRecategorize.description", { count: fileIds.length })}
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("modal.fileCreate.typeLabel")}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TYPES.map(qt => (
                      <button
                        key={qt}
                        type="button"
                        onClick={() => setCategory(qt)}
                        className="rounded-md border px-2.5 py-1 text-xs transition-colors"
                        style={{
                          background:  category === qt ? "var(--primary)"           : "var(--muted)",
                          color:       category === qt ? "var(--primary-foreground)" : "var(--muted-foreground)",
                          borderColor: category === qt ? "var(--primary)"            : "var(--border)",
                        }}
                      >
                        {categoryLabel(t, qt)}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder={t("modal.fileCreate.customTypePlaceholder")}
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Dialog.Close render={<Button type="button" variant="outline" />}>
                    {t("common.cancel")}
                  </Dialog.Close>
                  <Button type="submit" disabled={loading || !category.trim()}>
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
