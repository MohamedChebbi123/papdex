import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Star, FileText,
  Video, Pencil, Folder, BookOpen, Trash2,
} from "lucide-react"
import type { Step } from "react-joyride"
import { SemesterCreation } from "@/components/inputs/Semester_creation"
import { SemesterUpdate } from "@/components/inputs/Semester_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { TourGuide } from "@/components/inputs/tour_guide"
import { HelpButton } from "@/components/inputs/help_button"
import { RTL_LANGUAGES } from "@/i18n"
import { getSemestersByYear, deleteSemester } from "@/components/semester_service/file"
import { getSubjectsByYear, toggleFavoriteSubject } from "@/components/subjects_service/file"
import { getRecentFilesByYear, openFile, type RecentFile } from "@/components/file_service/file"
import { getVirtualFolderById } from "@/components/virtual_folders_service/file"

const COLORS = [
  "#6366f1", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0d9488", "#db2777",
]

const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "webm"]

type Semester = { id: number; name: string; start_date: string; end_date: string }
type Year = { id: number; name: string; start_date: string; end_date: string }

interface Subject {
  id: number
  semester_id: number
  name: string
  is_favorite: number
  semester_name: string
  semester_start_date: string
  semester_end_date: string
  file_count: number
}

interface Props {
  year: Year | null
  onSelectSemester: (semester: Semester) => void
  onSelectSubject: (year: Year, semester: Semester, subject: { id: number; name: string; is_favorite: number }) => void
  onOpenFile?: (params: {
    subject: { id: number; name: string; is_favorite: number }
    semester: Semester
    folder: { id: number; subject_id: number; name: string } | null
    fileId: number
  }) => void
}

export function Academicyeardashaboard({ year, onSelectSemester, onSelectSubject, onOpenFile }: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const BreadcrumbChevron = isRTL ? ChevronLeft : ChevronRight
  const [semesterModalOpen, setSemesterModalOpen] = useState(false)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null)
  const [hoveredSemId, setHoveredSemId] = useState<number | null>(null)
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    if (!year) return
    refreshSemesters()
    refreshSubjects()
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

  async function handleToggleFavorite(e: React.MouseEvent, subject: Subject) {
    e.stopPropagation()
    const next = subject.is_favorite ? 0 : 1
    await toggleFavoriteSubject(subject.id, next)
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, is_favorite: next } : s))
  }

  function handleSelectSubject(subject: Subject) {
    if (!year) return
    onSelectSubject(
      year,
      { id: subject.semester_id, name: subject.semester_name, start_date: subject.semester_start_date, end_date: subject.semester_end_date },
      { id: subject.id, name: subject.name, is_favorite: subject.is_favorite },
    )
  }

  async function handleOpenRecentFile(file: RecentFile) {
    const subject = subjects.find(s => s.id === file.subject_id)
    if (!subject) return
    const semester = { id: subject.semester_id, name: subject.semester_name, start_date: subject.semester_start_date, end_date: subject.semester_end_date }
    const subjectParam = { id: subject.id, name: subject.name, is_favorite: subject.is_favorite }

    if (file.folder_id) {
      const folder = await getVirtualFolderById(file.folder_id)
      onOpenFile?.({ subject: subjectParam, semester, folder, fileId: file.id })
    } else {
      onOpenFile?.({ subject: subjectParam, semester, folder: null, fileId: file.id })
      openFile(file.file_path)
    }
  }

  const totalFiles = subjects.reduce((acc, s) => acc + s.file_count, 0)
  const favoritesCount = subjects.filter(s => s.is_favorite).length

  const muted = "var(--muted-foreground)"
  const border = "var(--border)"
  const card = "var(--card)"
  const fg = "var(--foreground)"

  const tourSteps: Step[] = [
    { target: '[data-tour="year-hero"]', title: t("tour.year.hero.title"), content: t("tour.year.hero.content") },
    { target: '[data-tour="year-semesters"]', title: t("tour.year.semesters.title"), content: t("tour.year.semesters.content") },
    { target: '[data-tour="year-subjects"]', title: t("tour.year.subjects.title"), content: t("tour.year.subjects.content") },
    ...(recentFiles.length > 0 ? [{ target: '[data-tour="year-recent"]', title: t("tour.year.recent.title"), content: t("tour.year.recent.content") }] : []),
  ]

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit", maxWidth: 1100, margin: "0 auto" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: muted, fontSize: 12 }}>
          <Calendar size={13} />
          <BreadcrumbChevron size={13} />
          <span>{year?.name ?? "—"}</span>
        </div>
        <HelpButton onClick={() => setRunTour(true)} />
      </div>

      <TourGuide steps={tourSteps} run={runTour} onFinish={() => setRunTour(false)} />

      {/* Hero */}
      <div data-tour="year-hero" style={{
        background: "linear-gradient(120deg, rgba(59,130,246,0.16) 0%, rgba(99,102,241,0.08) 100%)",
        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: 14, padding: "20px 24px", marginBottom: 28,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg }}>
            {year?.name ?? t("academicYear.selectPrompt")}
          </h1>
          <p style={{ color: muted, fontSize: 12, margin: "5px 0 0" }}>
            {year ? `${year.start_date} — ${year.end_date}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { value: semesters.length, label: t("academicYear.statSemesters") },
            { value: subjects.length,  label: t("academicYear.statSubjects") },
            { value: totalFiles,       label: t("academicYear.statFilesIndexed") },
            { value: favoritesCount,   label: t("academicYear.statFavorites") },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: fg }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: muted }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Semesters section ── */}
      <div data-tour="year-semesters">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("academicYear.statSemesters")}</span>
      </div>

      {semesters.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", marginBottom: 28 }}>
          <BookOpen size={36} color={muted} />
          <p style={{ color: fg, fontSize: 14, fontWeight: 500, marginTop: 10, marginBottom: 4 }}>{t("academicYear.noSemestersTitle")}</p>
          <p style={{ color: muted, fontSize: 12, margin: 0 }}>{t("academicYear.noSemestersSubtitle")}</p>
          <button
            onClick={() => setSemesterModalOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 13, padding: "8px 16px", marginTop: 14,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={13} />
            {t("academicYear.addSemester")}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 300px))", gap: 12, marginBottom: 28 }}>
          {semesters.map((sem) => {
            const semSubjects = subjects.filter(s => s.semester_id === sem.id)
            const semFileCount = semSubjects.reduce((acc, s) => acc + s.file_count, 0)
            return (
              <div
                key={sem.id}
                onMouseEnter={() => setHoveredSemId(sem.id)}
                onMouseLeave={() => setHoveredSemId(null)}
                onClick={() => onSelectSemester(sem)}
                style={{
                  background: card,
                  border: `1px solid ${border}`,
                  borderRadius: 14, padding: 18, cursor: "pointer", position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={15} color={muted} />
                    <span style={{ color: fg, fontSize: 14, fontWeight: 600 }}>{sem.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                </div>
                <p style={{ color: muted, fontSize: 11, margin: "0 0 10px" }}>
                  {sem.start_date} — {sem.end_date}
                </p>
                {semSubjects.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    {semSubjects.slice(0, 8).map((s, i) => (
                      <span key={s.id} style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, fontSize: 10, color: muted }}>
                  <span>{t("common.subjectCount", { count: semSubjects.length })}</span>
                  <span>{t("common.fileCount", { count: semFileCount })}</span>
                </div>
              </div>
            )
          })}
          <div
            onClick={() => setSemesterModalOpen(true)}
            style={{
              border: `1px dashed ${border}`, borderRadius: 14,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: 18, cursor: "pointer", color: muted, minHeight: 90,
            }}
          >
            <Plus size={16} />
            <span style={{ fontSize: 11 }}>{t("academicYear.addSemester")}</span>
          </div>
        </div>
      )}
      </div>

      {/* Subjects section */}
      <div data-tour="year-subjects">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("academicYear.statSubjects")}</span>
      </div>

      {subjects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", marginBottom: 28 }}>
          <Folder size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>{t("academicYear.noSubjectsTitle")}</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>{t("academicYear.noSubjectsSubtitle")}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 240px))", gap: 12, marginBottom: 28 }}>
          {subjects.map((subject, i) => {
            const isFav = subject.is_favorite === 1
            const color = COLORS[i % COLORS.length]
            return (
              <div
                key={subject.id}
                onClick={() => handleSelectSubject(subject)}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ color: fg, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {subject.name}
                    </span>
                  </div>
                  <button onClick={e => handleToggleFavorite(e, subject)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                    <Star size={16} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : muted} />
                  </button>
                </div>
                <p style={{ color: muted, fontSize: 11, margin: "8px 0 0" }}>
                  {subject.semester_name} · {t("common.fileCount", { count: subject.file_count })}
                </p>
              </div>
            )
          })}
        </div>
      )}
      </div>

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div data-tour="year-recent">
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
