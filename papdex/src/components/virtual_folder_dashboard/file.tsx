import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertTriangle, Calendar, ChevronLeft, ChevronRight, ExternalLink, Eye, File, FileText,
  Folder, FolderInput, FolderPlus, Image, Pencil, Plus, Tag, Trash2, Video, X,
} from "lucide-react"
import type { Step } from "react-joyride"
import { Group, Panel, Separator } from "react-resizable-panels"
import {
  getVirtualFolderById,
  getVirtualFolderChildren,
  getVirtualFolderPath,
  deleteVirtualFolder,
  type VirtualFolderWithCounts,
} from "@/components/virtual_folders_service/file"
import {
  getFilesByFolder,
  deleteFile,
  openFile,
  markFileOpened,
  type AppFile,
} from "@/components/file_service/file"
import { VirtualFolderCreation } from "@/components/inputs/virtual_folder_creation"
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
    <span className="rounded text-[10px] font-bold uppercase px-2 py-0.5" style={{
      background: "var(--muted)", color: "var(--muted-foreground)",
      border: "1px solid var(--border)",
    }}>{categoryLabel(t, category)}</span>
  )
  return (
    <span className="rounded text-[10px] font-bold uppercase px-2 py-0.5" style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
    }}>{categoryLabel(t, category)}</span>
  )
}

interface VirtualFolder {
  id: number
  subject_id: number
  parent_folder_id: number | null
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
  onSelectFolder: (folder: { id: number; name: string }) => void
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
  initialFileId, onInitialFileHandled, onSelectFolder,
  onBack, onBackToSemester, onBackToYear,
}: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const BreadcrumbChevron = isRTL ? ChevronLeft : ChevronRight
  const [folder, setFolder] = useState<VirtualFolder | null>(null)
  const [files, setFiles] = useState<AppFile[]>([])
  const [subfolders, setSubfolders] = useState<VirtualFolderWithCounts[]>([])
  const [ancestorPath, setAncestorPath] = useState<{ id: number; name: string }[]>([])
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [createSubfolderOpen, setCreateSubfolderOpen] = useState(false)
  const [renamingSubfolder, setRenamingSubfolder] = useState<VirtualFolderWithCounts | null>(null)
  const [deletingSubfolder, setDeletingSubfolder] = useState<VirtualFolderWithCounts | null>(null)
  const [deletingFile, setDeletingFile] = useState<AppFile | null>(null)
  const [renamingFile, setRenamingFile] = useState<AppFile | null>(null)
  const [movingFile, setMovingFile] = useState<AppFile | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false)
  const [bulkRecategorizeOpen, setBulkRecategorizeOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [addFileOpen, setAddFileOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<AppFile | null>(null)
  const [extFilter, setExtFilter]           = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [runTour, setRunTour] = useState(false)

  function refreshSubfolders() {
    getVirtualFolderChildren(subject.id, folderId).then(setSubfolders)
  }

  useEffect(() => {
    getVirtualFolderById(folderId).then(setFolder)
    getFilesByFolder(folderId).then(setFiles)
    getVirtualFolderChildren(subject.id, folderId).then(setSubfolders)
    getVirtualFolderPath(folderId).then(setAncestorPath)
    setSelectedIds(new Set())
  }, [folderId, subject.id])

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
  }, [initialFileId, files, onInitialFileHandled])

  async function handleDelete() {
    await deleteVirtualFolder(folderId)
    setDeleteOpen(false)
    const parent = ancestorPath[ancestorPath.length - 1]
    if (parent) onSelectFolder(parent)
    else onBack()
  }

  async function handleDeleteSubfolder() {
    if (!deletingSubfolder) return
    await deleteVirtualFolder(deletingSubfolder.id)
    setDeletingSubfolder(null)
    refreshSubfolders()
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
    ...(subfolders.length > 0 ? [{ target: '[data-tour="vf-subfolders"]', title: t("tour.virtualFolder.subfolders.title"), content: t("tour.virtualFolder.subfolders.content") }] : []),
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
          {ancestorPath.flatMap(ancestor => [
            <BreadcrumbChevron key={`chevron-${ancestor.id}`} size={13} />,
            <button
              key={ancestor.id}
              onClick={() => onSelectFolder(ancestor)}
              style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}
            >
              {ancestor.name}
            </button>,
          ])}
          <BreadcrumbChevron size={13} />
          <span style={{ color: fg }}>{folder?.name ?? "..."}</span>
        </div>
        <HelpButton onClick={() => setRunTour(true)} />
      </div>

      <TourGuide steps={tourSteps} run={runTour} onFinish={() => setRunTour(false)} />

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-7">
        <div className="flex items-center gap-4">
          <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Folder size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-[24px] font-bold leading-tight text-foreground m-0">
              {folder?.name ?? t("common.loading")}
            </h1>
            <p className="text-muted-foreground text-[13px] mt-1 m-0">
              {subject.name} · {semester.name} · {t("common.fileCount", { count: files.length })}
            </p>
          </div>
        </div>

        <div data-tour="vf-actions" className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setRenameOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Pencil size={14} />
            {t("common.rename")}
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={14} />
            {t("common.delete")}
          </button>
          <button
            onClick={() => setCreateSubfolderOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <FolderPlus size={14} />
            {t("virtualFolder.newSubfolder")}
          </button>
          <button
            onClick={() => setAddFileOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            {t("virtualFolder.addFiles")}
          </button>
        </div>
      </div>

      {/* Subfolders */}
      {subfolders.length > 0 && (
        <div data-tour="vf-subfolders" className="mb-7">
          <div className="flex items-center mb-2.5">
            <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{t("virtualFolder.subfoldersHeading")}</span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 240px))" }}>
            {subfolders.map(sub => (
              <div
                key={sub.id}
                onClick={() => onSelectFolder(sub)}
                className="group relative rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <Folder size={24} className="text-primary" />
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); setRenamingSubfolder(sub) }}
                      className="flex rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingSubfolder(sub) }}
                      className="flex rounded-md p-1.5 text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <h4 className="text-foreground text-sm font-medium truncate">{sub.name}</h4>
                <p className="text-muted-foreground text-xs mt-1">
                  {t("common.fileCount", { count: sub.file_count })}
                  {sub.subfolder_count > 0 && ` · ${t("common.folderCount", { count: sub.subfolder_count })}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">{t("virtualFolder.filesHeading")}</span>
        <span className="text-muted-foreground text-[11px]">
          {t("common.ofCount", { filtered: filteredFiles.length, total: files.length })}
        </span>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-3.5 py-2 mb-2.5">
          <span className="text-foreground text-xs font-medium">
            {t("virtualFolder.selectedCount", { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBulkMoveOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
            >
              <FolderInput size={13} />
              {t("virtualFolder.bulkMove")}
            </button>
            <button
              onClick={() => setBulkRecategorizeOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
            >
              <Tag size={13} />
              {t("virtualFolder.bulkRecategorize")}
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-red-500/50 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={13} />
              {t("common.delete")}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="flex rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Filter chips */}
      {files.length > 0 && (
        <div data-tour="vf-filters" className="flex flex-col gap-2 mb-3.5">
          {/* Extension row */}
          {allExts.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground text-[10px] min-w-[52px]">{t("common.format")}</span>
              {["all", ...allExts].map(ext => (
                <button
                  key={ext}
                  onClick={() => setExtFilter(ext)}
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase transition-colors ${
                    extFilter === ext
                      ? "bg-primary text-primary-foreground border-primary font-semibold"
                      : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {ext === "all" ? t("common.all") : ext}
                </button>
              ))}
            </div>
          )}
          {/* Category row */}
          {allCategories.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground text-[10px] min-w-[52px]">{t("common.type")}</span>
              {["all", ...allCategories].map(cat => {
                const c = cat !== "all" ? CATEGORY_COLORS[cat] : null
                const active = categoryFilter === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className="rounded-full border px-3 py-1 text-[10px] font-medium transition-colors"
                    style={active ? {
                      background: c?.bg ?? "var(--primary)",
                      color: c?.text ?? "var(--primary-foreground)",
                      borderColor: c?.border ?? "var(--primary)",
                    } : {
                      borderColor: border, color: muted,
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
          className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card py-14 cursor-pointer hover:border-primary transition-colors"
        >
          <Plus size={36} className="text-muted-foreground" />
          <p className="text-foreground text-[15px] font-medium mt-3 mb-1">{t("virtualFolder.addFilesEmptyTitle")}</p>
          <p className="text-muted-foreground text-[13px] m-0">{t("virtualFolder.addFilesEmptySubtitle")}</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-muted-foreground">
          <File size={32} />
          <p className="mt-2.5 text-[13px]">{t("virtualFolder.noMatch")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 py-2.5 pl-4">
                  <input
                    type="checkbox"
                    checked={filteredFiles.every(f => selectedIds.has(f.id))}
                    onChange={toggleSelectAllFiltered}
                    className="cursor-pointer"
                    aria-label={t("virtualFolder.selectAll")}
                  />
                </th>
                <th className="py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("common.name")}</th>
                <th className="py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("common.type")}</th>
                <th className="py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("common.size")}</th>
                <th className="py-2.5 pr-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => (
                <tr
                  key={file.id}
                  className={`group border-b border-border last:border-0 transition-colors hover:bg-accent ${previewFile?.id === file.id ? "bg-primary/5" : ""}`}
                >
                  <td className="py-3 pl-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(file.id)}
                      onChange={e => toggleSelect(file.id, e.target.checked)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="py-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-muted-foreground flex-shrink-0">
                        <FileIcon type={file.file_type} />
                      </span>
                      <span className="text-foreground text-[13px] truncate">{file.file_name}</span>
                      {!file.exists && (
                        <span
                          title={t("common.fileMissingTooltip")}
                          className="flex items-center gap-1 flex-shrink-0 rounded-md border border-red-500 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500"
                        >
                          <AlertTriangle size={10} />
                          {t("common.fileMissing")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    {file.file_type
                      ? <CategoryBadge category={file.file_type} />
                      : <span className="text-muted-foreground text-[10px]">—</span>
                    }
                  </td>
                  <td className="py-3 text-muted-foreground text-xs text-right">
                    {formatSize(file.file_size)}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canPreview(file) && file.exists && (
                        <button
                          onClick={() => {
                            setPreviewFile(prev => prev?.id === file.id ? null : file)
                            if (previewFile?.id !== file.id) markFileOpened(file.id)
                          }}
                          className="flex rounded-md p-1.5 hover:bg-background transition-colors"
                        >
                          <Eye size={14} className={previewFile?.id === file.id ? "text-primary" : "text-muted-foreground"} />
                        </button>
                      )}
                      <button
                        onClick={() => { if (!file.exists) return; openFile(file.file_path); markFileOpened(file.id) }}
                        disabled={!file.exists}
                        title={!file.exists ? t("common.fileMissingTooltip") : undefined}
                        className="flex rounded-md p-1.5 text-muted-foreground hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() => setRenamingFile(file)}
                        className="flex rounded-md p-1.5 text-muted-foreground hover:bg-background transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setMovingFile(file)}
                        className="flex rounded-md p-1.5 text-muted-foreground hover:bg-background transition-colors"
                      >
                        <FolderInput size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingFile(file)}
                        className="flex rounded-md p-1.5 text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      <VirtualFolderCreation
        open={createSubfolderOpen}
        onOpenChange={setCreateSubfolderOpen}
        subjectId={subject.id}
        parentFolderId={folderId}
        onCreated={refreshSubfolders}
      />
      <VirtualFolderUpdate
        open={renamingSubfolder !== null}
        onOpenChange={open => { if (!open) setRenamingSubfolder(null) }}
        folder={renamingSubfolder}
        onUpdated={refreshSubfolders}
      />
      <DeleteConfirm
        open={deletingSubfolder !== null}
        onOpenChange={open => { if (!open) setDeletingSubfolder(null) }}
        label={deletingSubfolder?.name ?? ""}
        onConfirmed={handleDeleteSubfolder}
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
