import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle, Calendar, ChevronLeft, ChevronRight, ExternalLink, Eye, File, FileText,
  Folder, FolderInput, Image, Pencil, Plus, Tag, Trash2, Video, X,
} from "lucide-react"
import type { Step } from "react-joyride"
import { Group, Panel, Separator } from "react-resizable-panels"
import {
  getVirtualFolderById,
  deleteVirtualFolder,
} from "@/components/virtual_folders_service/file"
import {
  getFilesByFolder,
  deleteFile,
  openFile,
  markFileOpened,
  type AppFile,
} from "@/components/file_service/file"
import { VirtualFolderUpdate } from "@/components/inputs/virtual_folder_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { FileCreationInput } from "@/components/inputs/file_creation_input"
import { FileRename } from "@/components/inputs/file_rename"
import { FileMove } from "@/components/inputs/file_move"
import { FileBulkMove } from "@/components/inputs/file_bulk_move"
import { FileBulkRecategorize } from "@/components/inputs/file_bulk_recategorize"
import { FilePreviewPanel, canPreview } from "@/components/inputs/file_preview_modal"
import { TourGuide } from "@/components/inputs/tour_guide"
import { HelpButton } from "@/components/inputs/help_button"
import { RTL_LANGUAGES } from "@/i18n"
import { categoryLabel } from "@/lib/category_label"

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Summary:  { bg: "#14532d", text: "#4ade80", border: "#166534" },
  Lesson:   { bg: "#1e3a5f", text: "#60a5fa", border: "#1d4ed8" },
  Quiz:     { bg: "#3b1f6e", text: "#c084fc", border: "#7c3aed" },
  Exam:     { bg: "#431407", text: "#fb923c", border: "#c2410c" },
  Video:    { bg: "#0f2744", text: "#38bdf8", border: "#0369a1" },
  Notes:    { bg: "#1c1917", text: "#a8a29e", border: "#44403c" },
  Exercise: { bg: "#14403a", text: "#2dd4bf", border: "#0f766e" },
  TD:       { bg: "#1e1b4b", text: "#818cf8", border: "#4338ca" },
  TP:       { bg: "#4a1942", text: "#e879f9", border: "#a21caf" },
}

function CategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation()
  const c = CATEGORY_COLORS[category]
  if (!c) return (
    <span style={{
      background: "var(--muted)", color: "var(--muted-foreground)",
      border: "1px solid var(--border)", borderRadius: 6,
      fontSize: 10, padding: "2px 8px",
    }}>{categoryLabel(t, category)}</span>
  )
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 6, fontSize: 10, padding: "2px 8px", fontWeight: 500,
    }}>{categoryLabel(t, category)}</span>
  )
}

interface VirtualFolder {
  id: number
  subject_id: number
  name: string
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
  initialFileId?: number | null
  onInitialFileHandled?: () => void
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
  initialFileId, onInitialFileHandled,
  onBack, onBackToSemester, onBackToYear,
}: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const BreadcrumbChevron = isRTL ? ChevronLeft : ChevronRight
  const [folder, setFolder] = useState<VirtualFolder | null>(null)
  const [files, setFiles] = useState<AppFile[]>([])
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingFile, setDeletingFile] = useState<AppFile | null>(null)
  const [renamingFile, setRenamingFile] = useState<AppFile | null>(null)
  const [movingFile, setMovingFile] = useState<AppFile | null>(null)
  const [hoveredFileId, setHoveredFileId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false)
  const [bulkRecategorizeOpen, setBulkRecategorizeOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [addFileOpen, setAddFileOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<AppFile | null>(null)
  const [extFilter, setExtFilter]           = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    getVirtualFolderById(folderId).then(setFolder)
    getFilesByFolder(folderId).then(setFiles)
    setSelectedIds(new Set())
  }, [folderId])

  useEffect(() => {
    if (initialFileId == null) return
    const file = files.find(f => f.id === initialFileId)
    if (!file) return
    if (!file.exists) {
      onInitialFileHandled?.()
      return
    }
    if (canPreview(file)) {
      setPreviewFile(file)
      markFileOpened(file.id)
    } else {
      openFile(file.file_path)
      markFileOpened(file.id)
    }
    onInitialFileHandled?.()
  }, [initialFileId, files])

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

  function toggleSelect(id: number, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function toggleSelectAllFiltered() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      const allSelected = filteredFiles.every(f => next.has(f.id))
      for (const f of filteredFiles) {
        if (allSelected) next.delete(f.id)
        else next.add(f.id)
      }
      return next
    })
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds]
    await Promise.all(ids.map(id => deleteFile(id)))
    setFiles(prev => prev.filter(f => !selectedIds.has(f.id)))
    setSelectedIds(new Set())
  }

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  const allExts       = [...new Set(files.map(f => f.file_name.split(".").pop()?.toLowerCase() ?? "").filter(Boolean))].sort()
  const allCategories = [...new Set(files.map(f => f.file_type).filter(Boolean))].sort()

  const filteredFiles = files.filter(f => {
    const ext = f.file_name.split(".").pop()?.toLowerCase() ?? ""
    if (extFilter      !== "all" && ext          !== extFilter)      return false
    if (categoryFilter !== "all" && f.file_type  !== categoryFilter) return false
    return true
  })

  const tourSteps: Step[] = [
    { target: '[data-tour="vf-actions"]', title: t("tour.virtualFolder.actions.title"), content: t("tour.virtualFolder.actions.content") },
    ...(files.length > 0 ? [{ target: '[data-tour="vf-filters"]', title: t("tour.virtualFolder.filters.title"), content: t("tour.virtualFolder.filters.content") }] : []),
    { target: '[data-tour="vf-files"]', title: t("tour.virtualFolder.files.title"), content: t("tour.virtualFolder.files.content") },
  ]

  const dashboardContent = (
    <div style={{ padding: "28px 32px", fontFamily: "inherit", minHeight: "100%" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: muted, fontSize: 12 }}>
          <Calendar size={13} />
          <BreadcrumbChevron size={13} />
          <button onClick={onBackToYear} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
            {year.name}
          </button>
          <BreadcrumbChevron size={13} />
          <button onClick={onBackToSemester} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
            {semester.name}
          </button>
          <BreadcrumbChevron size={13} />
          <button onClick={onBack} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
            {subject.name}
          </button>
          <BreadcrumbChevron size={13} />
          <span style={{ color: fg }}>{folder?.name ?? "..."}</span>
        </div>
        <HelpButton onClick={() => setRunTour(true)} />
      </div>

      <TourGuide steps={tourSteps} run={runTour} onFinish={() => setRunTour(false)} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Folder size={22} color={muted} />
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg }}>
              {folder?.name ?? t("common.loading")}
            </h1>
          </div>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>
            {subject.name} · {semester.name} · {t("common.fileCount", { count: files.length })}
          </p>
        </div>

        <div data-tour="vf-actions" style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setAddFileOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={14} />
            {t("virtualFolder.addFiles")}
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
            {t("common.rename")}
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
            {t("common.delete")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ background: card, borderRadius: 12, padding: 20, border: `1px solid ${border}`, display: "inline-block" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{files.length}</div>
          <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{t("virtualFolder.statFiles")}</div>
        </div>
      </div>

      {/* Files */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {filteredFiles.length > 0 && (
            <input
              type="checkbox"
              checked={filteredFiles.every(f => selectedIds.has(f.id))}
              onChange={toggleSelectAllFiltered}
              style={{ cursor: "pointer" }}
              aria-label={t("virtualFolder.selectAll")}
            />
          )}
          <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("virtualFolder.filesHeading")}</span>
        </div>
        <span style={{ color: muted, fontSize: 11 }}>
          {t("common.ofCount", { filtered: filteredFiles.length, total: files.length })}
        </span>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--muted)", border: `1px solid ${border}`, borderRadius: 10,
          padding: "8px 14px", marginBottom: 10,
        }}>
          <span style={{ color: fg, fontSize: 12, fontWeight: 500 }}>
            {t("virtualFolder.selectedCount", { count: selectedIds.size })}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setBulkMoveOpen(true)}
              style={{
                background: card, border: `1px solid ${border}`, borderRadius: 8,
                color: fg, fontSize: 12, padding: "6px 12px",
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              }}
            >
              <FolderInput size={13} />
              {t("virtualFolder.bulkMove")}
            </button>
            <button
              onClick={() => setBulkRecategorizeOpen(true)}
              style={{
                background: card, border: `1px solid ${border}`, borderRadius: 8,
                color: fg, fontSize: 12, padding: "6px 12px",
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              }}
            >
              <Tag size={13} />
              {t("virtualFolder.bulkRecategorize")}
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              style={{
                background: "transparent", border: "1px solid #ef4444", borderRadius: 8,
                color: "#ef4444", fontSize: 12, padding: "6px 12px",
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
              {t("common.delete")}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", borderRadius: 6 }}
            >
              <X size={14} color={muted} />
            </button>
          </div>
        </div>
      )}

      {/* Filter chips */}
      {files.length > 0 && (
        <div data-tour="vf-filters" style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {/* Extension row */}
          {allExts.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ color: muted, fontSize: 10, minWidth: 52 }}>{t("common.format")}</span>
              {["all", ...allExts].map(ext => (
                <button
                  key={ext}
                  onClick={() => setExtFilter(ext)}
                  style={{
                    background: extFilter === ext ? "var(--primary)" : "var(--muted)",
                    color: extFilter === ext ? "var(--primary-foreground)" : muted,
                    border: `1px solid ${extFilter === ext ? "var(--primary)" : border}`,
                    borderRadius: 6, fontSize: 10, padding: "2px 10px",
                    cursor: "pointer", textTransform: "uppercase", fontWeight: extFilter === ext ? 600 : 400,
                  }}
                >
                  {ext === "all" ? t("common.all") : ext}
                </button>
              ))}
            </div>
          )}
          {/* Category row */}
          {allCategories.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ color: muted, fontSize: 10, minWidth: 52 }}>{t("common.type")}</span>
              {["all", ...allCategories].map(cat => {
                const c = cat !== "all" ? CATEGORY_COLORS[cat] : null
                const active = categoryFilter === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{
                      background: active ? (c?.bg ?? "var(--primary)") : "var(--muted)",
                      color:      active ? (c?.text ?? "var(--primary-foreground)") : muted,
                      border:     `1px solid ${active ? (c?.border ?? "var(--primary)") : border}`,
                      borderRadius: 6, fontSize: 10, padding: "2px 10px",
                      cursor: "pointer", fontWeight: active ? 600 : 400,
                    }}
                  >
                    {cat === "all" ? t("common.all") : categoryLabel(t, cat)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div data-tour="vf-files">
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
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>{t("virtualFolder.addFilesEmptyTitle")}</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>{t("virtualFolder.addFilesEmptySubtitle")}</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", color: muted }}>
          <File size={32} />
          <p style={{ marginTop: 10, fontSize: 13 }}>{t("virtualFolder.noMatch")}</p>
        </div>
      ) : (
        <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
          {filteredFiles.map((file, i) => (
            <div
              key={file.id}
              onMouseEnter={() => setHoveredFileId(file.id)}
              onMouseLeave={() => setHoveredFileId(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 16px",
                borderBottom: i < filteredFiles.length - 1 ? `1px solid ${border}` : "none",
                background: previewFile?.id === file.id ? "var(--muted)" : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(file.id)}
                  onChange={e => toggleSelect(file.id, e.target.checked)}
                  style={{
                    cursor: "pointer", flexShrink: 0,
                    opacity: selectedIds.size > 0 || hoveredFileId === file.id ? 1 : 0,
                  }}
                />
                <span style={{ color: muted, flexShrink: 0 }}>
                  <FileIcon type={file.file_type} />
                </span>
                <span style={{ color: fg, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file.file_name}
                </span>
                {!file.exists && (
                  <span
                    title={t("common.fileMissingTooltip")}
                    style={{
                      display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                      color: "#ef4444", fontSize: 10, fontWeight: 500,
                      background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444",
                      borderRadius: 6, padding: "2px 6px",
                    }}
                  >
                    <AlertTriangle size={10} />
                    {t("common.fileMissing")}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                {file.file_type
                  ? <CategoryBadge category={file.file_type} />
                  : <span style={{ color: muted, fontSize: 10 }}>—</span>
                }
                <span style={{ color: muted, fontSize: 12, minWidth: 52, textAlign: "end" }}>
                  {formatSize(file.file_size)}
                </span>
                {hoveredFileId === file.id ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {canPreview(file) && file.exists && (
                      <button
                        onClick={() => {
                          setPreviewFile(prev => prev?.id === file.id ? null : file)
                          if (previewFile?.id !== file.id) markFileOpened(file.id)
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                      >
                        <Eye size={13} color={previewFile?.id === file.id ? "var(--primary)" : muted} />
                      </button>
                    )}
                    <button
                      onClick={() => { if (!file.exists) return; openFile(file.file_path); markFileOpened(file.id) }}
                      disabled={!file.exists}
                      title={!file.exists ? t("common.fileMissingTooltip") : undefined}
                      style={{
                        background: "none", border: "none", padding: 4, display: "flex", borderRadius: 6,
                        cursor: file.exists ? "pointer" : "not-allowed", opacity: file.exists ? 1 : 0.4,
                      }}
                    >
                      <ExternalLink size={13} color={muted} />
                    </button>
                    <button
                      onClick={() => setRenamingFile(file)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                    >
                      <Pencil size={13} color={muted} />
                    </button>
                    <button
                      onClick={() => setMovingFile(file)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                    >
                      <FolderInput size={13} color={muted} />
                    </button>
                    <button
                      onClick={() => setDeletingFile(file)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: 94 }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )

  return (
    <>
      {previewFile ? (
        <Group orientation="horizontal" style={{ height: "100vh" }}>
          <Panel defaultSize={40} minSize={20} style={{ overflow: "auto" }}>
            {dashboardContent}
          </Panel>
          <Separator style={{
            width: 5, background: "var(--border)", cursor: "col-resize", flexShrink: 0,
          }} />
          <Panel defaultSize={60} minSize={25}>
            <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
          </Panel>
        </Group>
      ) : (
        <div style={{ minHeight: "100vh" }}>
          {dashboardContent}
        </div>
      )}

      <FileCreationInput
        open={addFileOpen}
        onOpenChange={setAddFileOpen}
        subjectId={subject.id}
        folderId={folderId}
        onCreated={file => setFiles(prev => [{ ...file, subject_id: subject.id, folder_id: folderId, created_at: "", updated_at: "", exists: true }, ...prev])}
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
      <FileRename
        open={renamingFile !== null}
        onOpenChange={open => { if (!open) setRenamingFile(null) }}
        file={renamingFile}
        onRenamed={name => {
          setFiles(prev => prev.map(f => f.id === renamingFile?.id ? { ...f, file_name: name } : f))
        }}
      />
      <FileMove
        open={movingFile !== null}
        onOpenChange={open => { if (!open) setMovingFile(null) }}
        file={movingFile}
        subjectId={subject.id}
        onMoved={() => {
          setFiles(prev => prev.filter(f => f.id !== movingFile?.id))
        }}
      />
      <FileBulkMove
        open={bulkMoveOpen}
        onOpenChange={setBulkMoveOpen}
        fileIds={[...selectedIds]}
        fileNames={Object.fromEntries(files.map(f => [f.id, f.file_name]))}
        currentFolderId={folderId}
        subjectId={subject.id}
        onMoved={() => {
          setFiles(prev => prev.filter(f => !selectedIds.has(f.id)))
          setSelectedIds(new Set())
        }}
      />
      <FileBulkRecategorize
        open={bulkRecategorizeOpen}
        onOpenChange={setBulkRecategorizeOpen}
        fileIds={[...selectedIds]}
        onRecategorized={category => {
          setFiles(prev => prev.map(f => selectedIds.has(f.id) ? { ...f, file_type: category } : f))
          setSelectedIds(new Set())
        }}
      />
      <DeleteConfirm
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        label={t("virtualFolder.selectedCount", { count: selectedIds.size })}
        onConfirmed={handleBulkDelete}
      />
    </>
  )
}
