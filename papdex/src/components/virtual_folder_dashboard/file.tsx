import { useState, useEffect } from "react"
import {
  Calendar, ChevronRight, FileText, Folder, Pencil, Star, Trash2,
} from "lucide-react"
import {
  getVirtualFolderById,
  toggleFavoriteVirtualFolder,
  deleteVirtualFolder,
} from "@/components/virtual_folders_service/file"
import { VirtualFolderUpdate } from "@/components/inputs/virtual_folder_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"

interface VirtualFolder {
  id: number
  subject_id: number
  name: string
  is_favorite: number
}

interface Subject {
  id: number
  name: string
}

interface Semester {
  id: number
  name: string
}

interface Year {
  id: number
  name: string
}

interface Props {
  folderId: number
  subject: Subject
  semester: Semester
  year: Year
  onBack: () => void
  onBackToSemester: () => void
  onBackToYear: () => void
}

export function VirtualFolderDashboard({
  folderId, subject, semester, year,
  onBack, onBackToSemester, onBackToYear,
}: Props) {
  const [folder, setFolder] = useState<VirtualFolder | null>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    getVirtualFolderById(folderId).then(setFolder)
  }, [folderId])

  async function handleToggleFavorite() {
    if (!folder) return
    const next = folder.is_favorite ? 0 : 1
    await toggleFavoriteVirtualFolder(folder.id, next)
    setFolder(prev => prev ? { ...prev, is_favorite: next } : prev)
  }

  async function handleDelete() {
    await deleteVirtualFolder(folderId)
    setDeleteOpen(false)
    onBack()
  }

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: muted, fontSize: 12 }}>
        <Calendar size={13} />
        <ChevronRight size={13} />
        <button onClick={onBackToYear} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
          {year.name}
        </button>
        <ChevronRight size={13} />
        <button onClick={onBackToSemester} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
          {semester.name}
        </button>
        <ChevronRight size={13} />
        <button onClick={onBack} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
          {subject.name}
        </button>
        <ChevronRight size={13} />
        <span style={{ color: fg }}>{folder?.name ?? "..."}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Folder size={22} color={muted} />
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg }}>
              {folder?.name ?? "Loading..."}
            </h1>
            <button
              onClick={handleToggleFavorite}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", marginTop: 2 }}
            >
              <Star
                size={20}
                fill={folder?.is_favorite ? "#f59e0b" : "none"}
                color={folder?.is_favorite ? "#f59e0b" : muted}
              />
            </button>
          </div>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>
            {subject.name} · {semester.name} · 0 files
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setRenameOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Pencil size={14} />
            Rename
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            style={{
              background: "transparent", border: "1px solid #ef4444", borderRadius: 10,
              color: "#ef4444", fontSize: 14, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { value: 0,                            label: "Files" },
          { value: folder?.is_favorite ? 1 : 0,  label: "Favorited" },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{stat.value}</div>
            <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Files */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Files</span>
      </div>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "60px 0", background: card, borderRadius: 14,
        border: `1px dashed ${border}`,
      }}>
        <FileText size={40} color={muted} />
        <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>No files yet</p>
        <p style={{ color: muted, fontSize: 13, margin: 0 }}>File management coming soon</p>
      </div>

      <VirtualFolderUpdate
        open={renameOpen}
        onOpenChange={setRenameOpen}
        folder={folder}
        onUpdated={() => getVirtualFolderById(folderId).then(setFolder)}
      />
      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        label={folder?.name ?? ""}
        onConfirmed={handleDelete}
      />
    </div>
  )
}
