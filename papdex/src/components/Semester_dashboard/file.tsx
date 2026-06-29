import { useState, useEffect } from "react"
import {
  Calendar, ChevronRight, FileText,
  Folder, Pencil, Plus, Star, Trash2, Video,
} from "lucide-react"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { SubjectCreation } from "@/components/inputs/subject_creation"
import {
  getSubjectsBySemester,
  toggleFavoriteSubject,
  deleteSubject,
} from "@/components/subjects_service/file"

const COLORS = [
  "#6366f1", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0d9488", "#db2777",
]

const MOCK_RECENT = [
  { name: "Chapter 5 — Graphs.pdf",       subject: "Data Structures", tag: "Exam",      type: "pdf" },
  { name: "Lecture 12 — TCP IP.pdf",      subject: "Networks",        tag: "Lecture",   type: "pdf" },
  { name: "Summary — Sorting.pdf",        subject: "Data Structures", tag: "Summary",   type: "pdf" },
  { name: "Assignment 3 — Dijkstra.docx", subject: "Algorithms",      tag: "Important", type: "doc" },
  { name: "Integration techniques.pdf",   subject: "Calculus II",     tag: "",          type: "pdf" },
]

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Exam:      { bg: "#431407", text: "#fb923c" },
  Summary:   { bg: "#14532d", text: "#4ade80" },
  Important: { bg: "#450a0a", text: "#f87171" },
  Lecture:   { bg: "#1e3a5f", text: "#60a5fa" },
}

function TagPill({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag]
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

interface Subject {
  id: number
  semester_id: number
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
  semester: Semester
  year: Year
  onBack: () => void
}

export function SemesterDashboard({ semester, year, onBack }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [editingNotes, setEditingNotes] = useState(false)

  useEffect(() => {
    getSubjectsBySemester(semester.id).then(setSubjects)
  }, [semester.id])

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

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit" }}>

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: muted, fontSize: 12 }}>
        <Calendar size={13} />
        <ChevronRight size={13} />
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", padding: 0 }}
        >
          {year.name}
        </button>
        <ChevronRight size={13} />
        <span style={{ color: fg }}>{semester.name}</span>
      </div>

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
            {semester.start_date} — {semester.end_date} · {subjects.length} subjects
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
          Add subject
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { value: subjects.length,  label: "Subjects" },
          { value: favoritesCount,   label: "Favorites" },
          { value: 0,                label: "Files indexed" },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, borderRadius: 12, padding: 20, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: fg }}>{stat.value}</div>
            <div style={{ color: muted, fontSize: 12, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Subjects */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Subjects</span>
      </div>

      {subjects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", marginBottom: 28 }}>
          <Folder size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>No subjects yet</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Add your first subject to start organizing files</p>
          <button
            onClick={() => setSubjectModalOpen(true)}
            style={{
              background: card, border: `1px solid ${border}`, borderRadius: 10,
              color: fg, fontSize: 14, padding: "10px 20px", marginTop: 16,
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <Plus size={14} />
            Add subject
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          {subjects.map((subject, i) => {
            const color = COLORS[i % COLORS.length]
            const isFav = subject.is_favorite === 1
            return (
              <div
                key={subject.id}
                onMouseEnter={() => setHoveredId(subject.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 16, cursor: "default", position: "relative" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ color: fg, fontSize: 13, fontWeight: 500 }}>{subject.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {hoveredId === subject.id && (
                      <button
                        onClick={() => setDeletingSubject(subject)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                      >
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleFavorite(subject)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <Star size={16} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : muted} />
                    </button>
                  </div>
                </div>
                <p style={{ color: muted, fontSize: 11, margin: "6px 0 0" }}>0 files</p>
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
        {MOCK_RECENT.map((file, i) => (
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

      {/* Notes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</span>
        <button
          onClick={() => setEditingNotes(e => !e)}
          style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <Pencil size={12} />
          {editingNotes ? "Done" : "Edit"}
        </button>
      </div>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, marginBottom: 28 }}>
        {editingNotes ? (
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes for this semester..."
            autoFocus
            style={{
              width: "100%", minHeight: 100, background: "transparent", border: "none", outline: "none",
              color: fg, fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6,
            }}
          />
        ) : (
          <p style={{ color: notes ? fg : muted, fontSize: 13, fontStyle: notes ? "normal" : "italic", margin: 0, whiteSpace: "pre-wrap" }}>
            {notes || "No notes yet — click Edit to add notes for this semester..."}
          </p>
        )}
      </div>

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
