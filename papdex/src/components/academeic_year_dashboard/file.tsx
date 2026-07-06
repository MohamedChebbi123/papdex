import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Star,
  Pencil, Folder, BookOpen, Trash2,
} from "lucide-react"
import type { Step } from "react-joyride"
import { SemesterCreation } from "@/components/inputs/Semester_creation"
import { SemesterUpdate } from "@/components/inputs/Semester_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { TourGuide } from "@/components/inputs/tour_guide"
import { HelpButton } from "@/components/inputs/help_button"
import { FileTypeIcon } from "@/components/inputs/file_type_icon"
import { RTL_LANGUAGES } from "@/i18n"
import { getSemestersByYear, deleteSemester } from "@/components/semester_service/file"
import { getSubjectsByYear, toggleFavoriteSubject } from "@/components/subjects_service/file"
import { getRecentFilesByYear, openFile, type RecentFile } from "@/components/file_service/file"
import { getVirtualFolderById } from "@/components/virtual_folders_service/file"

const COLORS = [
  "#6366f1", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0d9488", "#db2777",
]

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

  const refreshSemesters = useCallback(() => {
    if (year) getSemestersByYear(year.id).then(setSemesters)
  }, [year])

  const refreshSubjects = useCallback(() => {
    if (year) getSubjectsByYear(year.id).then(setSubjects)
  }, [year])

  useEffect(() => {
    if (!year) return
    refreshSemesters()
    refreshSubjects()
    getRecentFilesByYear(year.id).then(setRecentFiles)
  }, [year, refreshSemesters, refreshSubjects])

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
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: muted }}>
            <Calendar size={13} />
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {t("common.year")}
            </span>
          </span>
          <BreadcrumbChevron size={13} color={muted} />
          <span style={{ color: fg, fontWeight: 500 }}>{year?.name ?? "—"}</span>
        </div>
        <HelpButton onClick={() => setRunTour(true)} />
      </div>

      <TourGuide steps={tourSteps} run={runTour} onFinish={() => setRunTour(false)} />

      {/* Hero */}
      <div data-tour="year-hero" style={{
        background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 65%, black))",
        boxShadow: "0 12px 30px -14px color-mix(in srgb, var(--primary) 60%, transparent)",
        borderRadius: 16, padding: "28px 32px", marginBottom: 28,
        color: "var(--primary-foreground)",
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
          {year?.name ?? t("academicYear.selectPrompt")}
        </h1>
        <p style={{ opacity: 0.85, fontSize: 13, margin: "6px 0 24px" }}>
          {year ? `${year.start_date} — ${year.end_date}` : ""}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
          {[
            { value: semesters.length, label: t("academicYear.statSemesters") },
            { value: subjects.length,  label: t("academicYear.statSubjects") },
            { value: totalFiles,       label: t("academicYear.statFilesIndexed") },
            { value: favoritesCount,   label: t("academicYear.statFavorites") },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 10, padding: "10px 14px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.75 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Semesters section ── */}
      <div data-tour="year-semesters">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>{t("academicYear.statSemesters")}</span>
        <div style={{ height: 1, flex: 1, margin: "0 16px", background: border }} />
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
            return (
              <div
                key={sem.id}
                onMouseEnter={() => setHoveredSemId(sem.id)}
                onMouseLeave={() => setHoveredSemId(null)}
                onClick={() => onSelectSemester(sem)}
                className="transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  background: card,
                  border: `1.5px solid ${border}`,
                  borderRadius: 16, padding: "20px 22px", cursor: "pointer", position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BookOpen size={17} color={muted} />
                    <span style={{ color: fg, fontSize: 15, fontWeight: 700 }}>{sem.name}</span>
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
                <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>
                  {sem.start_date} — {sem.end_date}
                </p>
                {semSubjects.length > 0 && (
                  <div
                    style={{ display: "flex", gap: 5 }}
                    title={t("academicYear.colorHint")}
                  >
                    {semSubjects.slice(0, 8).map((s, i) => (
                      <span key={s.id} style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div
            onClick={() => setSemesterModalOpen(true)}
            className="border-2 border-dashed border-[color:var(--border)] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            style={{
              borderRadius: 16,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 4, padding: "20px 22px", cursor: "pointer", minHeight: 100,
            }}
          >
            <Plus size={18} />
            <span style={{ fontSize: 11, fontWeight: 500 }}>{t("academicYear.addSemester")}</span>
          </div>
        </div>
      )}
      </div>

      {/* Subjects section */}
      <div data-tour="year-subjects">
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>{t("academicYear.statSubjects")}</span>
        <div style={{ height: 1, flex: 1, margin: "0 16px", background: border }} />
      </div>

      {subjects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", marginBottom: 28 }}>
          <Folder size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>{t("academicYear.noSubjectsTitle")}</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>{t("academicYear.noSubjectsSubtitle")}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 220px))", gap: 10, marginBottom: 28 }}>
          {subjects.map((subject, i) => {
            const isFav = subject.is_favorite === 1
            const color = COLORS[i % COLORS.length]
            return (
              <div
                key={subject.id}
                onClick={() => handleSelectSubject(subject)}
                title={t("academicYear.colorHint")}
                className="transition-shadow hover:shadow-md"
                style={{
                  background: card,
                  border: `1px solid ${border}`,
                  borderInlineStart: `4px solid ${color}`,
                  borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: fg, fontSize: 13, fontWeight: 500, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {subject.name}
                  </span>
                  <button onClick={e => handleToggleFavorite(e, subject)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                    <Star size={14} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : muted} />
                  </button>
                </div>
                <p style={{ color: muted, fontSize: 11, margin: "6px 0 0" }}>
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
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: muted, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>{t("common.recentlyOpened")}</span>
            <div style={{ height: 1, flex: 1, margin: "0 16px", background: border }} />
          </div>
          <div style={{ marginBottom: 28 }}>
            {recentFiles.map(file => (
              <div
                key={file.id}
                onClick={() => handleOpenRecentFile(file)}
                className="hover:bg-accent transition-colors rounded-lg"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: `1px solid ${border}`, padding: "10px 12px", margin: "0 -12px", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "color-mix(in srgb, var(--primary) 12%, transparent)", flexShrink: 0,
                  }}>
                    <FileTypeIcon fileName={file.file_name} fileType={file.file_type} filePath={file.file_path} size={14} />
                  </div>
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
