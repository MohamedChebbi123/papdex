import { useState, useEffect, useMemo } from "react"
import {
  Calendar, ChevronRight, ExternalLink, Eye, File, FileText, Folder,
  FolderInput, Image, Trash2, Video,
} from "lucide-react"
import type { Step } from "react-joyride"
import { Group, Panel, Separator } from "react-resizable-panels"
import {
  getImportedFolderById,
  getImportedFolderFiles,
  deleteImportedFolder,
  openImportedFile,
  markImportedFileOpened,
  type ImportedFolder,
  type ImportedFolderFile,
} from "@/components/imported_folders_service/file"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { FilePreviewPanel, canPreview } from "@/components/inputs/file_preview_modal"
import { TourGuide } from "@/components/inputs/tour_guide"
import { HelpButton } from "@/components/inputs/help_button"
import type { AppFile } from "@/components/file_service/file"

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

function getChildrenAtPath(files: ImportedFolderFile[], currentPath: string) {
  const prefix = currentPath ? `${currentPath}/` : ""
  const folderCounts = new Map<string, number>()
  const directFiles: ImportedFolderFile[] = []

  for (const f of files) {
    if (prefix && !f.relative_path.startsWith(prefix)) continue
    const rest = prefix ? f.relative_path.slice(prefix.length) : f.relative_path
    const slashIndex = rest.indexOf("/")
    if (slashIndex === -1) {
      directFiles.push(f)
    } else {
      const folderName = rest.slice(0, slashIndex)
      folderCounts.set(folderName, (folderCounts.get(folderName) ?? 0) + 1)
    }
  }

  const folders = [...folderCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return { folders, files: directFiles }
}

function toAppFile(f: ImportedFolderFile): AppFile {
  return {
    id:         f.id,
    subject_id: 0,
    folder_id:  null,
    file_name:  f.file_name,
    file_path:  f.file_path,
    file_type:  f.file_type,
    file_size:  f.file_size,
    created_at: f.created_at,
    updated_at: f.created_at,
  }
}

export function ImportedFolderDashboard({
  folderId, subject, semester, year,
  onBack, onBackToSemester, onBackToYear,
}: Props) {
  const [folder, setFolder] = useState<ImportedFolder | null>(null)
  const [files, setFiles] = useState<ImportedFolderFile[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [hoveredFileId, setHoveredFileId] = useState<number | null>(null)
  const [previewFile, setPreviewFile] = useState<AppFile | null>(null)
  const [extFilter, setExtFilter] = useState<string>("all")
  const [currentPath, setCurrentPath] = useState<string>("")
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    getImportedFolderById(folderId).then(setFolder)
    getImportedFolderFiles(folderId).then(setFiles)
    setCurrentPath("")
  }, [folderId])

  async function handleDelete() {
    await deleteImportedFolder(folderId)
    setDeleteOpen(false)
    onBack()
  }

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  const { folders: childFolders, files: childFiles } = useMemo(
    () => getChildrenAtPath(files, currentPath),
    [files, currentPath]
  )

  const allExts = [...new Set(files.map(f => f.file_type).filter(Boolean))].sort()

  const filteredFiles = extFilter === "all"
    ? childFiles
    : childFiles.filter(f => f.file_type === extFilter)

  const pathSegments = currentPath ? currentPath.split("/") : []
  const isEmptyDir = childFolders.length === 0 && childFiles.length === 0

  const tourSteps: Step[] = [
    { target: '[data-tour="if-header"]', title: "Imported folder", content: "This mirrors a folder on your computer, shown at the path below. Its files aren't moved or copied — this is just a live view." },
    ...(allExts.length > 0 ? [{ target: '[data-tour="if-filters"]', title: "Filter files", content: "Narrow the current folder's files down by format." }] : []),
    { target: '[data-tour="if-files"]', title: "Browse files", content: "Subfolders and files are listed together. Click a subfolder to navigate into it, and hover a file to preview or open it." },
  ]

  const dashboardContent = (
    <div style={{ padding: "28px 32px", fontFamily: "inherit", minHeight: "100%" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: muted, fontSize: 12 }}>
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
        <HelpButton onClick={() => setRunTour(true)} />
      </div>

      <TourGuide steps={tourSteps} run={runTour} onFinish={() => setRunTour(false)} />

      {/* Header */}
      <div data-tour="if-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <FolderInput size={22} color={muted} />
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg }}>
              {folder?.name ?? "Loading..."}
            </h1>
          </div>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>
            {subject.name} · {semester.name} · {files.length} file{files.length !== 1 ? "s" : ""}
          </p>
          {folder?.original_path && (
            <p style={{ color: muted, fontSize: 11, margin: "4px 0 0", fontFamily: "monospace" }}>
              {folder.original_path}
            </p>
          )}
        </div>

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

      {/* Stats */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ background: card, borderRadius: 12, padding: 20, border: `1px solid ${border}`, display: "inline-block" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{files.length}</div>
          <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>Files</div>
        </div>
      </div>

      {/* In-folder breadcrumb */}
      {currentPath && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, color: muted, fontSize: 12, flexWrap: "wrap" }}>
          <button onClick={() => setCurrentPath("")} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
            {folder?.name ?? "Root"}
          </button>
          {pathSegments.map((seg, i) => {
            const segPath = pathSegments.slice(0, i + 1).join("/")
            const isLast = i === pathSegments.length - 1
            return (
              <span key={segPath} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ChevronRight size={13} />
                {isLast ? (
                  <span style={{ color: fg }}>{seg}</span>
                ) : (
                  <button onClick={() => setCurrentPath(segPath)} style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}>
                    {seg}
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Files */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {currentPath ? pathSegments[pathSegments.length - 1] : "Files"}
        </span>
        <span style={{ color: muted, fontSize: 11 }}>
          {childFolders.length > 0 && `${childFolders.length} folder${childFolders.length !== 1 ? "s" : ""} · `}
          {filteredFiles.length} of {childFiles.length} file{childFiles.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filter chips */}
      {allExts.length > 0 && (
        <div data-tour="if-filters" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <span style={{ color: muted, fontSize: 10, minWidth: 52 }}>Format</span>
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
              {ext === "all" ? "All" : ext}
            </button>
          ))}
        </div>
      )}

      <div data-tour="if-files">
      {files.length === 0 ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "60px 0", background: card, borderRadius: 14,
          border: `1px dashed ${border}`,
        }}>
          <FolderInput size={36} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>Folder is empty</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>No files were found in the imported folder</p>
        </div>
      ) : isEmptyDir ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", color: muted }}>
          <File size={32} />
          <p style={{ marginTop: 10, fontSize: 13 }}>No files match the selected filter</p>
        </div>
      ) : (
        <div style={{ background: card, borderRadius: 14, border: `1px solid ${border}`, overflow: "hidden" }}>
          {childFolders.map((cf, i) => (
            <div
              key={cf.name}
              onClick={() => setCurrentPath(currentPath ? `${currentPath}/${cf.name}` : cf.name)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 16px", cursor: "pointer",
                borderBottom: (i < childFolders.length - 1 || filteredFiles.length > 0) ? `1px solid ${border}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ color: muted, flexShrink: 0 }}>
                  <Folder size={15} />
                </span>
                <div style={{ color: fg, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {cf.name}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                <span style={{ color: muted, fontSize: 11 }}>{cf.count} file{cf.count !== 1 ? "s" : ""}</span>
                <ChevronRight size={14} color={muted} />
              </div>
            </div>
          ))}
          {filteredFiles.map((file, i) => {
            const appFile = toAppFile(file)
            return (
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
                  <span style={{ color: muted, flexShrink: 0 }}>
                    <FileIcon type={file.file_type} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: fg, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.file_name}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span style={{ color: muted, fontSize: 10, textTransform: "uppercase" }}>{file.file_type || "—"}</span>
                  <span style={{ color: muted, fontSize: 12, minWidth: 52, textAlign: "right" }}>
                    {formatSize(file.file_size)}
                  </span>
                  {hoveredFileId === file.id ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {canPreview(appFile) && (
                        <button
                          onClick={() => {
                            setPreviewFile(prev => prev?.id === file.id ? null : appFile)
                            if (previewFile?.id !== file.id) markImportedFileOpened(file.id)
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                        >
                          <Eye size={13} color={previewFile?.id === file.id ? "var(--primary)" : muted} />
                        </button>
                      )}
                      <button
                        onClick={() => { openImportedFile(file.file_path); markImportedFileOpened(file.id) }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", borderRadius: 6 }}
                      >
                        <ExternalLink size={13} color={muted} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: canPreview(appFile) ? 46 : 24 }} />
                  )}
                </div>
              </div>
            )
          })}
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
          <Separator style={{ width: 5, background: "var(--border)", cursor: "col-resize", flexShrink: 0 }} />
          <Panel defaultSize={60} minSize={25}>
            <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
          </Panel>
        </Group>
      ) : (
        <div style={{ minHeight: "100vh" }}>
          {dashboardContent}
        </div>
      )}

      <DeleteConfirm
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        label={folder?.name ?? ""}
        onConfirmed={handleDelete}
      />
    </>
  )
}
