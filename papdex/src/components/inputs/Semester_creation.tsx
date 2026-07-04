import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog } from "@base-ui/react/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createSemester } from "@/components/semester_service/file"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  yearId: number
  onCreated?: (id: number) => void
}

export function SemesterCreation({ open, onOpenChange, yearId, onCreated }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (startDate && endDate && endDate < startDate) return
    setLoading(true)
    try {
      const id = await createSemester(yearId, name, startDate, endDate)
      onCreated?.(id)
      onOpenChange(false)
      setName("")
      setStartDate("")
      setEndDate("")
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
              <Dialog.Title className="text-base font-semibold">{t("modal.semesterCreate.title")}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {t("modal.semesterCreate.description")}
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.name")}</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t("modal.semesterCreate.namePlaceholder")}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.startDate")}</label>
                  <Input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.endDate")}</label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Dialog.Close render={<Button type="button" variant="outline" />}>
                    {t("common.cancel")}
                  </Dialog.Close>
                  <Button type="submit" disabled={loading}>
                    {loading ? t("common.creating") : t("common.create")}
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
