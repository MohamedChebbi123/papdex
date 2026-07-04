import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Dialog } from "@base-ui/react/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmed: () => void
  label?: string
}

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function DeleteConfirm({ open, onOpenChange, onConfirmed, label }: Props) {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [input, setInput] = useState("")

  useEffect(() => {
    if (open) {
      setCode(generateCode())
      setInput("")
    }
  }, [open])

  function handleConfirm() {
    if (input !== code) return
    onConfirmed()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border bg-background shadow-xl transition-all duration-150 data-ending-style:opacity-0 data-ending-style:scale-95 data-starting-style:opacity-0 data-starting-style:scale-95">
            <div className="p-6 space-y-4">
              <div>
                <Dialog.Title className="text-base font-semibold text-destructive">{t("modal.deleteConfirm.title", { label })}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {t("modal.deleteConfirm.description")}
                </Dialog.Description>
              </div>

              <div className="rounded-md bg-muted px-4 py-2 text-center font-mono text-lg font-bold tracking-widest">
                {code}
              </div>

              <Input
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                placeholder={t("modal.deleteConfirm.placeholder")}
                className="font-mono tracking-widest"
              />

              <div className="flex justify-end gap-2">
                <Dialog.Close render={<Button type="button" variant="outline" />}>
                  {t("common.cancel")}
                </Dialog.Close>
                <Button
                  variant="destructive"
                  disabled={input !== code}
                  onClick={handleConfirm}
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
