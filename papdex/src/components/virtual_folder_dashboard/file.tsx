import { useState, useEffect } from "react"
import {
  Calendar, ChevronRight, ExternalLink, Eye, File, FileText,
  Folder, Image, Pencil, Plus, Star, Trash2, Video,
} from "lucide-react"
import {
  getVirtualFolderById,
  toggleFavoriteVirtualFolder,
  deleteVirtualFolder,
} from "@/components/virtual_folders_service/file"
import {
  getFilesByFolder,
  deleteFile,
  openFile,
  type AppFile,
} from "@/components/file_service/file"
import { VirtualFolderUpdate } from "@/components/inputs/virtual_folder_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { FileCreationInput } from "@/components/inputs/file_creation_input"
import { FilePreviewModal, canPreview } from "@/components/inputs/file_preview_modal"

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

function formatSize(bytes: number | null): string {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ type }: { type: string }) {
  const t = type.toLowerCase()
  if (["pdf", "doc", "docx", "txt", "md"].includes(t)) return <FileText size={15} />
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(t)) return <Image size={15} />
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(t)) return <Video size={15} />
  return <File size={15} />
}

export function VirtualFolderDashboard({
  folderId, subject, semester, year,
  onBack, onBackToSemester, onBackToYear,
}: Props) {
  const [folder, setFolder] = useState<VirtualFolder | null>(null)
  const [files, setFiles] = useState<AppFile[]>([])
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingFile, setDeletingFile] = useState<AppFile | null>(null)
  const [hoveredFileId, setHoveredFileId] = useState<number | null>(null)
  const [addFileOpen, setAddFileOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<AppFile | null>(null)

  useEffect(() => {
    getVirtualFolderById(folderId).then(setFolder)
    getFilesByFolder(folderId).then(setFiles)
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

  async function handleDeleteFile() {
    if (!deletingFile) return
    await deleteFile(deletingFile.id)
    setFiles(prev => prev.filter(f => f.id !== deletingFile.id))
    setDeletingFile(null)
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
              <Star size={20} fill={folder?.is_favorite ? "#f59e0b" : "none"} color={folder?.is_favorite ? "#f59e0b" : muted} />
            </button>
          </div>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>
            {subject.name} · {semester.name} · {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setAddFileOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Add files
          </button>
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
          { value: files.length,                 label: "Files" },
          { value: folder?.is_favorite ? 1 : 0,  label: "Favorited" },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{stat.value}</div>
            <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Files */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Files</span>
      </div>

      {files.length === 0 ? (
        <div
          onClick={() => setAddFileOpen(true)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "60px 0", background: card, borderRadius: 14,
            border: `1px dashed ${border}`, cursor: "pointer",
          }}
        >
          <Plus size={36} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>Add files</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Click to open file picker</p>
        </div>
      ) : (
        <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
          {files.map((file, i) => (
            <div
              key={file.id}
              onMouseEnter={() => setHoveredFileId(file.id)}
              onMouseLeave={() => setHoveredFileId(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 16px",
                borderBottom: i < files.length - 1 ? `1px solid ${border}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ color: muted, flexShrink: 0 }}>
                  <FileIcon type={file.file_type} />
                </span>
                <span style={{ color: fg, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.file_name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{
                  background: "var(--muted)", color: muted, fontSize: 10,
                  padding: "2px 8px", borderRadius: 6, border: `1px solid ${border}`,
                  textTransform: "uppercase",
                }}>
                  {file.file_type || "—"}
                </span>
                <span style={{ color: muted, fontSize: 12, minWidth: 52, textAlign: "right" }}>
                  {formatSize(file.file_size)}
                </span>
                {hoveredFileId === file.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {canPreview(file) && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                      >
                        <Eye size={13} color={muted} />
                      </button>
                    )}
                    <button
                      onClick={() => openFile(file.file_path)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                    >
                      <ExternalLink size={13} color={muted} />
                    </button>
                    <button
                      onClick={() => setDeletingFile(file)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: 46 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <FileCreationInput
        open={addFileOpen}
        onOpenChange={setAddFileOpen}
        subjectId={subject.id}
        folderId={folderId}
        onCreated={file => setFiles(prev => [{ ...file, subject_id: subject.id, folder_id: folderId, created_at: "", updated_at: "" }, ...prev])}
      />
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
      <DeleteConfirm
        open={deletingFile !== null}
        onOpenChange={open => { if (!open) setDeletingFile(null) }}
        label={deletingFile?.file_name ?? ""}
        onConfirmed={handleDeleteFile}
      />
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  )
}
