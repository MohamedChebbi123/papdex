import { useState, useEffect } from "react"
import {
  Calendar, ChevronRight, FileText,
  Folder, FolderInput, Pencil, Plus, Star, Trash2,
} from "lucide-react"
import { getSubjectById, toggleFavoriteSubject } from "@/components/subjects_service/file"
import {
  getVirtualFoldersBySubject,
  deleteVirtualFolder,
} from "@/components/virtual_folders_service/file"
import {
  getImportedFoldersBySubject,
  deleteImportedFolder,
  importFolder,
  type ImportedFolder,
} from "@/components/imported_folders_service/file"
import { VirtualFolderCreation } from "@/components/inputs/virtual_folder_creation"
import { VirtualFolderUpdate } from "@/components/inputs/virtual_folder_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"

interface VirtualFolder {
  id: number
  subject_id: number
  name: string
  file_count: number
}

interface Subject {
  id: number
  name: string
  is_favorite: number
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
  subjectId: number
  semester: Semester
  year: Year
  onBack: () => void
  onBackToYear: () => void
  onSelectFolder: (folder: VirtualFolder) => void
  onSelectImportedFolder: (folder: ImportedFolder) => void
}

export function SubjectDashboard({ subjectId, semester, year, onBack, onBackToYear, onSelectFolder, onSelectImportedFolder }: Props) {
  const [subject, setSubject] = useState<Subject | null>(null)
  const [folders, setFolders] = useState<VirtualFolder[]>([])
  const [importedFolders, setImportedFolders] = useState<ImportedFolder[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<VirtualFolder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<VirtualFolder | null>(null)
  const [deletingImported, setDeletingImported] = useState<ImportedFolder | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [hoveredImportedId, setHoveredImportedId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    getSubjectById(subjectId).then(setSubject)
    getVirtualFoldersBySubject(subjectId).then(setFolders)
    getImportedFoldersBySubject(subjectId).then(setImportedFolders)
  }, [subjectId])

  function refresh() {
    getSubjectById(subjectId).then(setSubject)
    getVirtualFoldersBySubject(subjectId).then(setFolders)
    getImportedFoldersBySubject(subjectId).then(setImportedFolders)
  }

  async function handleToggleSubjectFavorite() {
    if (!subject) return
    const next = subject.is_favorite ? 0 : 1
    await toggleFavoriteSubject(subjectId, next)
    setSubject(prev => prev ? { ...prev, is_favorite: next } : prev)
  }

  async function handleDeleteFolder() {
    if (!deletingFolder) return
    await deleteVirtualFolder(deletingFolder.id)
    setDeletingFolder(null)
    getVirtualFoldersBySubject(subjectId).then(setFolders)
  }

  async function handleDeleteImported() {
    if (!deletingImported) return
    await deleteImportedFolder(deletingImported.id)
    setDeletingImported(null)
    getImportedFoldersBySubject(subjectId).then(setImportedFolders)
  }

  async function handleImportFolder() {
    setImporting(true)
    try {
      const result = await importFolder(subjectId)
      if (result) setImportedFolders(prev => [result, ...prev])
    } finally {
      setImporting(false)
    }
  }

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit", maxWidth: 1100, margin: "0 auto" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: muted, fontSize: 12 }}>
        <Calendar size={13} />
        <ChevronRight size={13} />
        <button
          onClick={onBackToYear}
          style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}
        >
          {year.name}
        </button>
        <ChevronRight size={13} />
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}
        >
          {semester.name}
        </button>
        <ChevronRight size={13} />
        <span style={{ color: fg }}>{subject?.name ?? "..."}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg, display: "flex", alignItems: "center", gap: 10 }}>
            {subject?.name ?? "Loading..."}
            <button
              onClick={handleToggleSubjectFavorite}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", marginTop: 2 }}
            >
              <Star
                size={20}
                fill={subject?.is_favorite ? "#f59e0b" : "none"}
                color={subject?.is_favorite ? "#f59e0b" : muted}
              />
            </button>
          </h1>
          <p style={{ color: muted, fontSize: 13, margin: "4px 0 0" }}>
            {semester.name} · {folders.length} folders · {importedFolders.length} imported
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleImportFolder}
            disabled={importing}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 6, cursor: importing ? "not-allowed" : "pointer",
              opacity: importing ? 0.6 : 1,
            }}
          >
            <FolderInput size={14} />
            {importing ? "Importing..." : "Import folder"}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={14} />
            New folder
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28, maxWidth: 480 }}>
        {[
          { value: folders.length,         label: "Folders" },
          { value: importedFolders.length, label: "Imported" },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${border}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{stat.value}</div>
            <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Virtual Folders */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Folders</span>
      </div>

      {folders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", marginBottom: 28 }}>
          <Folder size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>No folders yet</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Create a folder to organize your files</p>
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px", marginTop: 16,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={14} />
            New folder
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
          {folders.map(folder => (
            <div
              key={folder.id}
              onMouseEnter={() => setHoveredId(folder.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectFolder(folder)}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, cursor: "pointer", position: "relative" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Folder size={15} color={muted} />
                  <span style={{ color: fg, fontSize: 13, fontWeight: 500 }}>{folder.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {hoveredId === folder.id && (
                    <>
                      <button
                        onClick={e => { e.stopPropagation(); setEditingFolder(folder) }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                      >
                        <Pencil size={13} color={muted} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingFolder(folder) }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p style={{ color: muted, fontSize: 11, margin: "6px 0 0" }}>{folder.file_count} file{folder.file_count === 1 ? "" : "s"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Imported Folders */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Imported Folders</span>
      </div>

      {importedFolders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", marginBottom: 28 }}>
          <FolderInput size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>No imported folders yet</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Import an OS folder to bring in all its files at once</p>
          <button
            onClick={handleImportFolder}
            disabled={importing}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px", marginTop: 16,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <FolderInput size={14} />
            Import folder
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
          {importedFolders.map(folder => (
            <div
              key={folder.id}
              onMouseEnter={() => setHoveredImportedId(folder.id)}
              onMouseLeave={() => setHoveredImportedId(null)}
              onClick={() => onSelectImportedFolder(folder)}
              style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, cursor: "pointer", position: "relative" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <FolderInput size={15} color={muted} style={{ flexShrink: 0 }} />
                  <span style={{ color: fg, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{folder.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  {hoveredImportedId === folder.id && (
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingImported(folder) }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  )}
                </div>
              </div>
              <p style={{ color: muted, fontSize: 11, margin: "6px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {folder.file_count} file{folder.file_count !== 1 ? "s" : ""} · {folder.original_path}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Files placeholder */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Files</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", marginBottom: 28 }}>
        <FileText size={36} color={muted} />
        <p style={{ color: fg, fontSize: 14, fontWeight: 500, marginTop: 10, marginBottom: 4 }}>No files yet</p>
        <p style={{ color: muted, fontSize: 12, margin: 0 }}>File management coming soon</p>
      </div>

      <VirtualFolderCreation
        open={createOpen}
        onOpenChange={setCreateOpen}
        subjectId={subjectId}
        onCreated={refresh}
      />
      <VirtualFolderUpdate
        open={editingFolder !== null}
        onOpenChange={open => { if (!open) setEditingFolder(null) }}
        folder={editingFolder}
        onUpdated={refresh}
      />
      <DeleteConfirm
        open={deletingFolder !== null}
        onOpenChange={open => { if (!open) setDeletingFolder(null) }}
        label={deletingFolder?.name ?? ""}
        onConfirmed={handleDeleteFolder}
      />
      <DeleteConfirm
        open={deletingImported !== null}
        onOpenChange={open => { if (!open) setDeletingImported(null) }}
        label={deletingImported?.name ?? ""}
        onConfirmed={handleDeleteImported}
      />
    </div>
  )
}
