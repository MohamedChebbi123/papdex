import { useState, useEffect } from "react"
import {
  Calendar, ChevronRight, Plus, Star, FileText,
  Video, Pencil, Folder, BookOpen, Trash2,
} from "lucide-react"
import { SemesterCreation } from "@/components/inputs/Semester_creation"
import { SemesterUpdate } from "@/components/inputs/Semester_update"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { getSemestersByYear, deleteSemester } from "@/components/semester_service/file"

const subjects = [
  { name: "Data Structures", color: "#6366f1", files: 28, favorite: true,  tags: ["Exam", "Lecture", "Summary"] },
  { name: "Networks",        color: "#0891b2", files: 17, favorite: true,  tags: ["Exam", "Lecture"] },
  { name: "Calculus II",     color: "#059669", files: 34, favorite: false, tags: ["Summary", "Reference"] },
  { name: "Linear Algebra",  color: "#d97706", files: 11, favorite: false, tags: ["Lecture"] },
  { name: "Algorithms",      color: "#7c3aed", files: 22, favorite: false, tags: ["Exam", "Assignment"] },
  { name: "Databases",       color: "#dc2626", files: 9,  favorite: false, tags: ["Lecture", "Reference"] },
]

const recentFiles = [
  { name: "Chapter 5 — Graphs.pdf",       subject: "Data Structures", tag: "Exam",      type: "pdf" },
  { name: "Lecture 12 — TCP IP.pdf",      subject: "Networks",        tag: "Lecture",   type: "pdf" },
  { name: "Summary — Sorting.pdf",        subject: "Data Structures", tag: "Summary",   type: "pdf" },
  { name: "Assignment 3 — Dijkstra.docx", subject: "Algorithms",      tag: "Important", type: "doc" },
  { name: "Integration techniques.pdf",   subject: "Calculus II",     tag: "",          type: "pdf" },
]

const tagColors: Record<string, { bg: string; text: string }> = {
  Exam:      { bg: "#431407", text: "#fb923c" },
  Summary:   { bg: "#14532d", text: "#4ade80" },
  Important: { bg: "#450a0a", text: "#f87171" },
  Lecture:   { bg: "#1e3a5f", text: "#60a5fa" },
}

function TagPill({ tag }: { tag: string }) {
  const colors = tagColors[tag]
  if (!colors) return null
  return (
    <span style={{
      background: colors.bg, color: colors.text,
      fontSize: 10, padding: "2px 8px", borderRadius: 6,
      border: "1px solid var(--border)",
    }}>
      {tag}
    </span>
  )
}

type Semester = { id: number; name: string; start_date: string; end_date: string }

interface Props {
  year: { id: number; name: string; start_date: string; end_date: string } | null
  onSelectSemester: (semester: Semester) => void
}

export function Academicyeardashaboard({ year, onSelectSemester }: Props) {
  const [favorites, setFavorites] = useState<string[]>(
    subjects.filter(s => s.favorite).map(s => s.name)
  )
  const [semesterModalOpen, setSemesterModalOpen] = useState(false)
  const [semesters, setSemesters] = useState<any[]>([])
  const [editingSemester, setEditingSemester] = useState<any | null>(null)
  const [deletingSemester, setDeletingSemester] = useState<any | null>(null)
  const [hoveredSemId, setHoveredSemId] = useState<number | null>(null)

  useEffect(() => {
    if (!year) return
    getSemestersByYear(year.id).then(setSemesters)
  }, [year?.id])

  function refreshSemesters() {
    if (year) getSemestersByYear(year.id).then(setSemesters)
  }

  async function handleDeleteSemester() {
    if (!deletingSemester) return
    await deleteSemester(deletingSemester.id)
    setDeletingSemester(null)
    refreshSemesters()
  }

  function toggleFavorite(name: string) {
    setFavorites(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const totalFiles = subjects.reduce((acc, s) => acc + s.files, 0)
  const examTags = subjects.filter(s => s.tags.includes("Exam")).length

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
        <button style={{
          background: card, border: `1px solid ${border}`, borderRadius: 10,
          color: fg, fontSize: 14, padding: "10px 20px",
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
        }}>
          <Plus size={14} />
          Add subject
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { value: subjects.length,  label: "Subjects" },
          { value: totalFiles,       label: "Files indexed" },
          { value: examTags,         label: "Exam tags" },
          { value: favorites.length, label: "Favorites" },
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
          {semesters.map((sem: any) => (
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
                      onClick={() => setEditingSemester(sem)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                    >
                      <Pencil size={13} color={muted} />
                    </button>
                    <button
                      onClick={() => setDeletingSemester(sem)}
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
            </div>
          ))}
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
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Add your first subject to start organizing files</p>
          <button style={{
            background: card, border: `1px solid ${border}`, borderRadius: 10,
            color: fg, fontSize: 14, padding: "10px 20px", marginTop: 16,
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
          }}>
            <Plus size={14} />
            Add subject
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {subjects.map(subject => {
            const isFav = favorites.includes(subject.name)
            return (
              <div
                key={subject.name}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, cursor: "default" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: subject.color, flexShrink: 0 }} />
                    <span style={{ color: fg, fontSize: 13, fontWeight: 500 }}>{subject.name}</span>
                  </div>
                  <button onClick={() => toggleFavorite(subject.name)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                    <Star size={16} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : muted} />
                  </button>
                </div>
                <p style={{ color: muted, fontSize: 11, margin: "4px 0 0" }}>· {subject.files} files</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12 }}>
                  {subject.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ background: "var(--muted)", border: `1px solid ${border}`, borderRadius: 6, color: muted, fontSize: 10, padding: "2px 8px" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent files */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Recently Opened</span>
        <button style={{ background: "none", border: "none", color: "#2563eb", fontSize: 12, cursor: "pointer" }}>See all</button>
      </div>
      <div style={{ marginBottom: 28 }}>
        {recentFiles.map((file, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: `1px solid ${border}`, padding: "10px 0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {file.type === "mp4" ? <Video size={16} color={muted} /> : <FileText size={16} color={muted} />}
              <span style={{ color: fg, fontSize: 13 }}>{file.name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: muted, fontSize: 11 }}>{file.subject}</span>
              {file.tag && <TagPill tag={file.tag} />}
            </div>
          </div>
        ))}
      </div>

      {/* Notes preview */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Semester Notes</span>
        <button style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Pencil size={12} />
          Edit
        </button>
      </div>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 28 }}>
        <p style={{ color: muted, fontSize: 13, fontStyle: "italic", margin: 0 }}>
          No notes yet — click Edit to add notes for this semester...
        </p>
      </div>

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
