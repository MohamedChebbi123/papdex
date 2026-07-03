import { useState, useEffect } from "react"
import {
  Calendar, ChevronRight, Plus, FileText,
  Video, Pencil, Folder, BookOpen, Trash2,
} from "lucide-react"
import { SemesterCreation } from "@/components/inputs/Semester_creation"
import { SemesterUpdate } from "@/components/inputs/Semester_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { getSemestersByYear, deleteSemester } from "@/components/semester_service/file"
import { getSubjectsByYear } from "@/components/subjects_service/file"
import { getRecentFilesByYear, openFile, type RecentFile } from "@/components/file_service/file"
import { getVirtualFolderById } from "@/components/virtual_folders_service/file"

const COLORS = [
  "#6366f1", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0d9488", "#db2777",
]

const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "webm"]

type Semester = { id: number; name: string; start_date: string; end_date: string }
type Subject = { id: number; semester_id: number; name: string; is_favorite: number; file_count: number; total_size: number }

function formatSize(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`
}

interface Props {
  year: { id: number; name: string; start_date: string; end_date: string } | null
  onSelectSemester: (semester: Semester) => void
  onSelectSubject?: (subject: Subject, semester: Semester) => void
  onOpenFile?: (params: {
    subject: Subject
    semester: Semester
    folder: { id: number; subject_id: number; name: string; is_favorite: number } | null
    fileId: number
  }) => void
}

export function Academicyeardashaboard({ year, onSelectSemester, onSelectSubject, onOpenFile }: Props) {
  const [semesterModalOpen, setSemesterModalOpen] = useState(false)
  const [semesters, setSemesters] = useState<any[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [editingSemester, setEditingSemester] = useState<any | null>(null)
  const [deletingSemester, setDeletingSemester] = useState<any | null>(null)
  const [hoveredSemId, setHoveredSemId] = useState<number | null>(null)

  useEffect(() => {
    if (!year) return
    getSemestersByYear(year.id).then(setSemesters)
    getSubjectsByYear(year.id).then(setSubjects)
    getRecentFilesByYear(year.id).then(setRecentFiles)
  }, [year?.id])

  function refreshSemesters() {
    if (year) getSemestersByYear(year.id).then(setSemesters)
  }

  function refreshSubjects() {
    if (year) getSubjectsByYear(year.id).then(setSubjects)
  }

  async function handleDeleteSemester() {
    if (!deletingSemester) return
    await deleteSemester(deletingSemester.id)
    setDeletingSemester(null)
    refreshSemesters()
    refreshSubjects()
  }

  function handleSelectSubject(subject: Subject) {
    const semester = semesters.find(s => s.id === subject.semester_id)
    if (semester) onSelectSubject?.(subject, semester)
  }

  async function handleOpenRecentFile(file: RecentFile) {
    const subject = subjects.find(s => s.id === file.subject_id)
    const semester = subject && semesters.find(s => s.id === subject.semester_id)
    if (!subject || !semester) return

    if (file.folder_id) {
      const folder = await getVirtualFolderById(file.folder_id)
      onOpenFile?.({ subject, semester, folder, fileId: file.id })
    } else {
      onOpenFile?.({ subject, semester, folder: null, fileId: file.id })
      openFile(file.file_path)
    }
  }

  const totalFiles = subjects.reduce((acc, s) => acc + s.file_count, 0)
  const totalSize = subjects.reduce((acc, s) => acc + s.total_size, 0)

  const muted = "var(--muted-foreground)"
  const border = "var(--border)"
  const card = "var(--card)"
  const fg = "var(--foreground)"

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: muted, fontSize: 12 }}>
        <Calendar size={13} />
        <ChevronRight size={13} />
        <span>{year?.name ?? "—"}</span>
      </div>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{
            display: "inline-block", background: "#166534", color: "#4ade80",
            fontSize: 10, padding: "2px 10px", borderRadius: 20, marginBottom: 6,
          }}>
            Active
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg }}>
            {year?.name ?? "Select an academic year"}
          </h1>
          <p style={{ color: muted, fontSize: 13, margin: "4px 0 0" }}>
            Sep 2025 — Jan 2026 · {subjects.length} subjects · {totalFiles} files indexed
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { value: semesters.length,   label: "Semesters" },
          { value: subjects.length,    label: "Subjects" },
          { value: totalFiles,         label: "Files indexed" },
          { value: formatSize(totalSize), label: "Total size" },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{stat.value}</div>
            <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Semesters section ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Semesters</span>
        <button
          onClick={() => setSemesterModalOpen(true)}
          style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <Plus size={12} />
          Add semester
        </button>
      </div>

      {semesters.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", marginBottom: 28 }}>
          <BookOpen size={36} color={muted} />
          <p style={{ color: fg, fontSize: 14, fontWeight: 500, marginTop: 10, marginBottom: 4 }}>No semesters yet</p>
          <p style={{ color: muted, fontSize: 12, margin: 0 }}>Add a semester to start organizing subjects</p>
          <button
            onClick={() => setSemesterModalOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 13, padding: "8px 16px", marginTop: 14,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={13} />
            Add semester
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
          {semesters.map((sem: any) => {
          const semSubjects = subjects.filter(s => s.semester_id === sem.id)
          const semFileCount = semSubjects.reduce((acc, s) => acc + s.file_count, 0)
          return (
            <div
              key={sem.id}
              onMouseEnter={() => setHoveredSemId(sem.id)}
              onMouseLeave={() => setHoveredSemId(null)}
              onClick={() => onSelectSemester(sem)}
              style={{
                background: card, border: `1px solid ${border}`,
                borderRadius: 14, padding: 18, cursor: "pointer", position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen size={15} color={muted} />
                  <span style={{ color: fg, fontSize: 14, fontWeight: 600 }}>{sem.name}</span>
                </div>
                {hoveredSemId === sem.id && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingSemester(sem) }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                    >
                      <Pencil size={13} color={muted} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingSemester(sem) }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                    >
                      <Trash2 size={13} color="#ef4444" />
                    </button>
                  </div>
                )}
              </div>
              <p style={{ color: muted, fontSize: 11, margin: "0 0 10px" }}>
                {sem.start_date} — {sem.end_date}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {semSubjects.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {semSubjects.slice(0, 6).map((s, i) => (
                      <div key={s.id} style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                    ))}
                  </div>
                )}
                <span style={{ color: muted, fontSize: 12 }}>
                  {semSubjects.length} subject{semSubjects.length !== 1 ? "s" : ""} · {semFileCount} file{semFileCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Subjects section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Subjects</span>
        <button style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer" }}>Manage</button>
      </div>

      {subjects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
          <Folder size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>No subjects yet</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Open a semester to add your first subject</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {subjects.map((subject, i) => {
            const color = COLORS[i % COLORS.length]
            return (
              <div
                key={subject.id}
                onClick={() => handleSelectSubject(subject)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--muted)", border: `1px solid ${border}`,
                  borderRadius: 999, padding: "6px 14px", cursor: "pointer",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ color: fg, fontSize: 13, fontWeight: 500 }}>{subject.name}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recently Opened</span>
          </div>
          <div style={{ marginBottom: 28 }}>
            {recentFiles.map(file => (
              <div
                key={file.id}
                onClick={() => handleOpenRecentFile(file)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: `1px solid ${border}`, padding: "10px 0", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {VIDEO_EXTENSIONS.includes(file.file_type) ? <Video size={16} color={muted} /> : <FileText size={16} color={muted} />}
                  <span style={{ color: fg, fontSize: 13 }}>{file.file_name}</span>
                </div>
                <span style={{ color: muted, fontSize: 11 }}>{file.subject_name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <SemesterCreation
        open={semesterModalOpen}
        onOpenChange={setSemesterModalOpen}
        yearId={year?.id ?? 0}
        onCreated={refreshSemesters}
      />
      <SemesterUpdate
        open={editingSemester !== null}
        onOpenChange={open => { if (!open) setEditingSemester(null) }}
        semester={editingSemester}
        onUpdated={refreshSemesters}
      />
      <DeleteConfirm
        open={deletingSemester !== null}
        onOpenChange={open => { if (!open) setDeletingSemester(null) }}
        label={deletingSemester?.name}
        onConfirmed={handleDeleteSemester}
      />

    </div>
  )
}
