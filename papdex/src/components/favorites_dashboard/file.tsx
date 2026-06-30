import { useEffect, useState } from "react"
import { FlaskConical, Star } from "lucide-react"
import { getFavoriteSubjects, toggleFavoriteSubject } from "@/components/subjects_service/file"

interface FavoriteSubject {
  id: number
  name: string
  semester_id: number
  is_favorite: number
  semester_name: string
  semester_start_date: string
  semester_end_date: string
  year_id: number
  year_name: string
  year_start_date: string
  year_end_date: string
}

interface Props {
  onSelectSubject: (
    subject: { id: number; name: string; is_favorite: number },
    semester: { id: number; name: string; start_date: string; end_date: string },
    year: { id: number; name: string; start_date: string; end_date: string },
  ) => void
}

const COLORS = [
  "#6366f1", "#0891b2", "#059669", "#d97706",
  "#7c3aed", "#dc2626", "#0d9488", "#db2777",
]

export function FavoritesDashboard({ onSelectSubject }: Props) {
  const [subjects, setSubjects] = useState<FavoriteSubject[]>([])

  useEffect(() => {
    getFavoriteSubjects().then(setSubjects)
  }, [])

  async function handleUnfavorite(e: React.MouseEvent, subject: FavoriteSubject) {
    e.stopPropagation()
    await toggleFavoriteSubject(subject.id, 0)
    setSubjects(prev => prev.filter(s => s.id !== subject.id))
  }

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  return (
    <div style={{ minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Star size={20} fill="#f59e0b" color="#f59e0b" />
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: fg }}>Favorites</h1>
        </div>
        <p style={{ color: muted, fontSize: 13, margin: 0 }}>
          {subjects.length} favourite {subjects.length === 1 ? "subject" : "subjects"}
        </p>
      </div>

      {subjects.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0" }}>
          <Star size={40} color={muted} />
          <p style={{ color: fg, fontSize: 15, fontWeight: 500, marginTop: 12, marginBottom: 4 }}>No favourites yet</p>
          <p style={{ color: muted, fontSize: 13, margin: 0 }}>Star a subject to add it here</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {subjects.map((subject, i) => {
            const color = COLORS[i % COLORS.length]
            return (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(
                  { id: subject.id, name: subject.name, is_favorite: subject.is_favorite },
                  { id: subject.semester_id, name: subject.semester_name, start_date: subject.semester_start_date, end_date: subject.semester_end_date },
                  { id: subject.year_id, name: subject.year_name, start_date: subject.year_start_date, end_date: subject.year_end_date },
                )}
                style={{
                  background: card, border: `1px solid ${border}`, borderRadius: 14,
                  padding: 16, cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ color: fg, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {subject.name}
                    </span>
                  </div>
                  <button
                    onClick={e => handleUnfavorite(e, subject)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0, display: "flex" }}
                    title="Remove from favourites"
                  >
                    <Star size={15} fill="#f59e0b" color="#f59e0b" />
                  </button>
                </div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <FlaskConical size={11} color={muted} />
                  <span style={{ color: muted, fontSize: 11 }}>
                    {subject.year_name} · {subject.semester_name}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
