import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  Calendar, ChevronLeft, ChevronRight, FileText,
  Folder, Plus, Star, Trash2, Video,
} from "lucide-react"
import type { Step } from "react-joyride"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { SubjectCreation } from "@/components/inputs/subject_creation"
import { TourGuide } from "@/components/inputs/tour_guide"
import { HelpButton } from "@/components/inputs/help_button"
import { RTL_LANGUAGES } from "@/i18n"
import {
  getSubjectsBySemester,
  toggleFavoriteSubject,
  deleteSubject,
} from "@/components/subjects_service/file"
import {
  getRecentFilesBySemester,
  getFileTypeCountBySemester,
  openFile,
  type RecentFile,
} from "@/components/file_service/file"
import { getVirtualFolderById } from "@/components/virtual_folders_service/file"

const COLORS = [
  "#6366f1", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0d9488", "#db2777",
]

const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "webm"]

interface Subject {
  id: number
  semester_id: number
  name: string
  is_favorite: number
  file_count: number
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
  semester: Semester
  year: Year
  onBack: () => void
  onSelectSubject: (subject: Subject) => void
  onOpenFile?: (params: {
    subject: Subject
    semester: Semester
    folder: { id: number; subject_id: number; name: string } | null
    fileId: number
  }) => void
}

export function SemesterDashboard({ semester, year, onBack, onSelectSubject, onOpenFile }: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const BreadcrumbChevron = isRTL ? ChevronLeft : ChevronRight
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [examCount, setExamCount] = useState(0)
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    getSubjectsBySemester(semester.id).then(setSubjects)
    getRecentFilesBySemester(semester.id).then(setRecentFiles)
    getFileTypeCountBySemester(semester.id, "Exam").then(setExamCount)
  }, [semester.id])

  async function handleOpenRecentFile(file: RecentFile) {
    const subject = subjects.find(s => s.id === file.subject_id)
    if (!subject) return

    if (file.folder_id) {
      const folder = await getVirtualFolderById(file.folder_id)
      onOpenFile?.({ subject, semester, folder, fileId: file.id })
    } else {
      onOpenFile?.({ subject, semester, folder: null, fileId: file.id })
      openFile(file.file_path)
    }
  }

  function refresh() {
    getSubjectsBySemester(semester.id).then(setSubjects)
  }

  async function handleToggleFavorite(subject: Subject) {
    const next = subject.is_favorite ? 0 : 1
    await toggleFavoriteSubject(subject.id, next)
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, is_favorite: next } : s))
  }

  async function handleDeleteSubject() {
    if (!deletingSubject) return
    await deleteSubject(deletingSubject.id)
    setDeletingSubject(null)
    refresh()
  }

  const favoritesCount = subjects.filter(s => s.is_favorite).length
  const totalFiles = subjects.reduce((acc, s) => acc + (s.file_count ?? 0), 0)

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  const tourSteps: Step[] = [
    { target: '[data-tour="sem-stats"]', title: t("tour.semester.stats.title"), content: t("tour.semester.stats.content") },
    { target: '[data-tour="sem-subjects"]', title: t("tour.semester.subjects.title"), content: t("tour.semester.subjects.content") },
    ...(recentFiles.length > 0 ? [{ target: '[data-tour="sem-recent"]', title: t("tour.semester.recent.title"), content: t("tour.semester.recent.content") }] : []),
  ]

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit", maxWidth: 1100, margin: "0 auto" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: muted, fontSize: 12 }}>
          <Calendar size={13} />
          <BreadcrumbChevron size={13} />
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}
          >
            {year.name}
          </button>
          <BreadcrumbChevron size={13} />
          <span style={{ color: fg }}>{semester.name}</span>
        </div>
        <HelpButton onClick={() => setRunTour(true)} />
      </div>

      <TourGuide steps={tourSteps} run={runTour} onFinish={() => setRunTour(false)} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{
            display: "inline-block", background: "#1e3a5f", color: "#60a5fa",
            fontSize: 10, padding: "2px 10px", borderRadius: 20, marginBottom: 6,
          }}>
            {semester.name}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg }}>
            {semester.name}
          </h1>
          <p style={{ color: muted, fontSize: 13, margin: "4px 0 0" }}>
            {semester.start_date} — {semester.end_date} · {t("common.subjectCount", { count: subjects.length })}
          </p>
        </div>
        <button
          onClick={() => setSubjectModalOpen(true)}
          style={{
            background: card, border: `1px solid ${border}`, borderRadius: 10,
            color: fg, fontSize: 14, padding: "10px 20px",
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
          }}
        >
          <Plus size={14} />
          {t("semester.addSubject")}
        </button>
      </div>

      {/* Stats */}
      <div data-tour="sem-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { value: subjects.length,  label: t("semester.statSubjects") },
          { value: totalFiles,       label: t("semester.statFilesIndexed") },
          { value: examCount,        label: t("semester.statExamTagged") },
          { value: favoritesCount,   label: t("semester.statFavorites") },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, borderRadius: 12, padding: "14px 16px", border: `1px solid ${border}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{stat.value}</div>
            <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Subjects */}
      <div data-tour="sem-subjects">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("semester.statSubjects")}</span>
      </div>

      {subjects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", marginBottom: 28 }}>
          <Folder size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>{t("semester.noSubjectsTitle")}</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>{t("semester.noSubjectsSubtitle")}</p>
          <button
            onClick={() => setSubjectModalOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px", marginTop: 16,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={14} />
            {t("semester.addSubject")}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 240px))", gap: 12, marginBottom: 28 }}>
          {subjects.map((subject, i) => {
            const color = COLORS[i % COLORS.length]
            const isFav = subject.is_favorite === 1
            return (
              <div
                key={subject.id}
                onMouseEnter={() => setHoveredId(subject.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectSubject(subject)}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, cursor: "pointer", position: "relative" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ color: fg, fontSize: 13, fontWeight: 500 }}>{subject.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {hoveredId === subject.id && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingSubject(subject) }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleFavorite(subject) }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <Star size={16} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : muted} />
                    </button>
                  </div>
                </div>
                <p style={{ color: muted, fontSize: 11, margin: "6px 0 0" }}>
                  {t("common.fileCount", { count: subject.file_count })}
                </p>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div data-tour="sem-recent">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("common.recentlyOpened")}</span>
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
        </div>
      )}

      <SubjectCreation
        open={subjectModalOpen}
        onOpenChange={setSubjectModalOpen}
        semesterId={semester.id}
        onCreated={refresh}
      />
      <DeleteConfirm
        open={deletingSubject !== null}
        onOpenChange={open => { if (!open) setDeletingSubject(null) }}
        label={deletingSubject?.name ?? ""}
        onConfirmed={handleDeleteSubject}
      />
    </div>
  )
}
