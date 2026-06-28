import { useEffect, useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateAcademicYear } from "@/components/academic_year_service/file"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: { id: number; name: string; start_date: string; end_date: string } | null
  onUpdated?: () => void
}

export function AcademicYearUpdate({ open, onOpenChange, year, onUpdated }: Props) {
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (year) {
      setName(year.name)
      setStartDate(year.start_date)
      setEndDate(year.end_date)
    }
  }, [year])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!year) return
    setLoading(true)
    try {
      await updateAcademicYear(year.id, name, startDate, endDate)
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
              <Dialog.Title className="text-base font-semibold">Edit Academic Year</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Update the details for this academic year.
              </Dialog.Description>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. 2024-2025"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Dialog.Close render={<Button type="button" variant="outline" />}>
                    Cancel
                  </Dialog.Close>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
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
