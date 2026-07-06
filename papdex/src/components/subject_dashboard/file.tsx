import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  Calendar, ChevronLeft, ChevronRight, ExternalLink, FileText,
  Folder, FolderInput, Pencil, Plus, Star, Trash2,
} from "lucide-react"
import type { Step } from "react-joyride"
import { RTL_LANGUAGES } from "@/i18n"
import { getSubjectById, toggleFavoriteSubject } from "@/components/subjects_service/file"
import {
  getVirtualFoldersBySubject,
  deleteVirtualFolder,
} from "@/components/virtual_folders_service/file"
import {
  getImportedFoldersBySubject,
  deleteImportedFolder,
  importFolder,
  getRecentImportedFilesBySubject,
  openImportedFile,
  type ImportedFolder,
  type RecentImportedFile,
} from "@/components/imported_folders_service/file"
import { getRecentFilesBySubject, openFile, type RecentFile } from "@/components/file_service/file"
import { VirtualFolderCreation } from "@/components/inputs/virtual_folder_creation"
import { VirtualFolderUpdate } from "@/components/inputs/virtual_folder_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { TourGuide } from "@/components/inputs/tour_guide"
import { HelpButton } from "@/components/inputs/help_button"

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
  start_date: string
  end_date: string
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
  onOpenFile?: (params: {
    subject: Subject
    semester: Semester
    folder: { id: number; name: string } | null
    fileId: number
  }) => void
}

type RecentEntry =
  | { kind: "virtual"; file: RecentFile }
  | { kind: "imported"; file: RecentImportedFile }

export function SubjectDashboard({ subjectId, semester, year, onBack, onBackToYear, onSelectFolder, onSelectImportedFolder, onOpenFile }: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const BreadcrumbChevron = isRTL ? ChevronLeft : ChevronRight
  const [subject, setSubject] = useState<Subject | null>(null)
  const [folders, setFolders] = useState<VirtualFolder[]>([])
  const [importedFolders, setImportedFolders] = useState<ImportedFolder[]>([])
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [recentImported, setRecentImported] = useState<RecentImportedFile[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<VirtualFolder | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<VirtualFolder | null>(null)
  const [deletingImported, setDeletingImported] = useState<ImportedFolder | null>(null)
  const [importing, setImporting] = useState(false)
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    getSubjectById(subjectId).then(setSubject)
    getVirtualFoldersBySubject(subjectId).then(setFolders)
    getImportedFoldersBySubject(subjectId).then(setImportedFolders)
    getRecentFilesBySubject(subjectId).then(setRecentFiles)
    getRecentImportedFilesBySubject(subjectId).then(setRecentImported)
  }, [subjectId])

  function refresh() {
    getSubjectById(subjectId).then(setSubject)
    getVirtualFoldersBySubject(subjectId).then(setFolders)
    getImportedFoldersBySubject(subjectId).then(setImportedFolders)
  }

  const recentEntries: RecentEntry[] = [
    ...recentFiles.map(file => ({ kind: "virtual" as const, file })),
    ...recentImported.map(file => ({ kind: "imported" as const, file })),
  ]
    .sort((a, b) => new Date(b.file.opened_at).getTime() - new Date(a.file.opened_at).getTime())
    .slice(0, 6)

  function handleOpenRecentEntry(entry: RecentEntry) {
    if (entry.kind === "imported") {
      openImportedFile(entry.file.file_path)
      return
    }
    const file = entry.file
    if (!subject) return
    if (file.folder_id) {
      const folder = folders.find(f => f.id === file.folder_id)
      if (folder) {
        onOpenFile?.({ subject, semester, folder, fileId: file.id })
        return
      }
    }
    onOpenFile?.({ subject, semester, folder: null, fileId: file.id })
    openFile(file.file_path)
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
  const fg     = "var(--foreground)"

  const tourSteps: Step[] = [
    { target: '[data-tour="subj-actions"]', title: t("tour.subject.actions.title"), content: t("tour.subject.actions.content") },
    { target: '[data-tour="subj-folders"]', title: t("tour.subject.folders.title"), content: t("tour.subject.folders.content") },
    { target: '[data-tour="subj-imported"]', title: t("tour.subject.imported.title"), content: t("tour.subject.imported.content") },
    ...(recentEntries.length > 0 ? [{ target: '[data-tour="subj-recent"]', title: t("tour.subject.recent.title"), content: t("tour.subject.recent.content") }] : []),
  ]

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit", maxWidth: 1100, margin: "0 auto" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: muted, fontSize: 12 }}>
          <Calendar size={13} />
          <BreadcrumbChevron size={13} />
          <button
            onClick={onBackToYear}
            style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}
          >
            {year.name}
          </button>
          <BreadcrumbChevron size={13} />
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}
          >
            {semester.name}
          </button>
          <BreadcrumbChevron size={13} />
          <span style={{ color: fg }}>{subject?.name ?? "..."}</span>
        </div>
        <HelpButton onClick={() => setRunTour(true)} />
      </div>

      <TourGuide steps={tourSteps} run={runTour} onFinish={() => setRunTour(false)} />

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-bold leading-tight text-foreground m-0">
            {subject?.name ?? t("common.loading")}
            <button
              onClick={handleToggleSubjectFavorite}
              className="bg-transparent border-none cursor-pointer p-0 flex mt-0.5"
            >
              <Star
                size={20}
                fill={subject?.is_favorite ? "#f59e0b" : "none"}
                color={subject?.is_favorite ? "#f59e0b" : muted}
              />
            </button>
          </h1>
          <p className="text-muted-foreground text-[13px] mt-1 m-0">
            {semester.name} · {t("common.folderCount", { count: folders.length })} · {t("subject.importedCount", { count: importedFolders.length })}
          </p>
        </div>
        <div data-tour="subj-actions" className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleImportFolder}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FolderInput size={14} />
            {importing ? t("subject.importing") : t("subject.importFolder")}
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            {t("subject.newFolder")}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-[480px]">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Folder size={20} className="text-primary" />
          </div>
          <div>
            <div className="text-[28px] font-bold leading-tight text-foreground">{folders.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t("subject.statFolders")}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <FolderInput size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-[28px] font-bold leading-tight text-foreground">{importedFolders.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t("subject.statImported")}</div>
          </div>
        </div>
      </div>

      {/* Virtual Folders */}
      <div data-tour="subj-folders">
      <div className="flex items-center mb-3">
        <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">{t("subject.foldersHeading")}</span>
        <div className="h-px flex-1 mx-4 bg-border" />
      </div>

      {folders.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 mb-7">
          <Folder size={40} color={muted} />
          <p className="text-foreground text-[15px] font-medium mt-3 mb-1">{t("subject.noFoldersTitle")}</p>
          <p className="text-muted-foreground text-[13px] m-0">{t("subject.noFoldersSubtitle")}</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors mt-4"
          >
            <Plus size={14} />
            {t("subject.newFolder")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 mb-7" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 240px))" }}>
          {folders.map(folder => (
            <div
              key={folder.id}
              onClick={() => onSelectFolder(folder)}
              className="group relative rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <Folder size={28} className="text-primary" />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingFolder(folder) }}
                    className="flex rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeletingFolder(folder) }}
                    className="flex rounded-md p-1.5 text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h4 className="text-foreground text-sm font-medium truncate">{folder.name}</h4>
              <p className="text-muted-foreground text-xs mt-1">{t("common.fileCount", { count: folder.file_count })}</p>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Imported Folders */}
      <div data-tour="subj-imported">
      <div className="flex items-center mb-3">
        <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">{t("subject.importedFoldersHeading")}</span>
        <div className="h-px flex-1 mx-4 bg-border" />
      </div>

      {importedFolders.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10 mb-7">
          <FolderInput size={40} color={muted} />
          <p className="text-foreground text-[15px] font-medium mt-3 mb-1">{t("subject.noImportedTitle")}</p>
          <p className="text-muted-foreground text-[13px] m-0">{t("subject.noImportedSubtitle")}</p>
          <button
            onClick={handleImportFolder}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <FolderInput size={14} />
            {t("subject.importFolder")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 mb-7" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 240px))" }}>
          {importedFolders.map(folder => (
            <div
              key={folder.id}
              onClick={() => onSelectImportedFolder(folder)}
              className="group relative rounded-xl border border-dashed border-border bg-background p-4 cursor-pointer hover:border-amber-500/60 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <FolderInput size={28} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setDeletingImported(folder) }}
                    className="flex rounded-md p-1.5 text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h4 className="text-foreground text-sm font-medium truncate">{folder.name}</h4>
              <p className="text-muted-foreground text-xs mt-1 truncate">
                {t("common.fileCount", { count: folder.file_count })} · {folder.original_path}
              </p>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Recently Opened */}
      {recentEntries.length > 0 && (
        <div data-tour="subj-recent" className="pb-10">
          <div className="flex items-center mb-3">
            <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">{t("common.recentlyOpened")}</span>
            <div className="h-px flex-1 mx-4 bg-border" />
          </div>
          <div className="space-y-2">
            {recentEntries.map(entry => (
              <div
                key={`${entry.kind}-${entry.file.id}`}
                onClick={() => handleOpenRecentEntry(entry)}
                className="group flex items-center justify-between rounded-lg bg-card border border-border p-4 cursor-pointer hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm truncate">{entry.file.file_name}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {entry.kind === "imported" ? (
                    <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <FolderInput size={12} />
                      {entry.file.folder_name}
                    </span>
                  ) : (
                    <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-medium text-foreground">
                      <Folder size={12} />
                      {folders.find(f => f.id === entry.file.folder_id)?.name ?? t("common.noFolder")}
                    </span>
                  )}
                  <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
