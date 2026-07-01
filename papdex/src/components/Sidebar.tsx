import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  BookOpen, ChevronDown, ChevronRight,
  GraduationCap, Home, Moon, Pencil,
  Plus, Settings, Star, Sun, Trash2, FlaskConical,
} from "lucide-react"
import { useEffect, useState } from "react"
import { AcademicYearCreation } from "./inputs/Academic_year_creation"
import { AcademicYearUpdate } from "./inputs/Academic_year_update"
import { DeleteConfirm } from "./inputs/Delete_confirm"
import { AiModelsPanel } from "./inputs/ai_models_panel"
import { deleteAcademicYear, getAllAcademicYears } from "./academic_year_service/file"
import { getSemestersByYear } from "./semester_service/file"
import { getSubjectsBySemester } from "./subjects_service/file"
import { getUser, updateUser, type User } from "./user_service/file"

type AcademicYear = {
  id: number
  name: string
  start_date: string
  end_date: string
}

type Semester = {
  id: number
  name: string
  start_date: string
  end_date: string
}

type Subject = {
  id: number
  name: string
  is_favorite: number
}

export type { AcademicYear }

interface Props {
  onSelectYear: (year: AcademicYear) => void
  onSelectSemester: (year: AcademicYear, semester: Semester) => void
  onSelectSubject: (year: AcademicYear, semester: Semester, subject: Subject) => void
  onShowFavorites: () => void
}

export function AppSidebar({ onSelectYear, onSelectSemester, onSelectSubject, onShowFavorites }: Props) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"))
  const [showCreateYear, setShowCreateYear] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [deletingYear, setDeletingYear] = useState<AcademicYear | null>(null)
  const [hoveredYearId, setHoveredYearId] = useState<number | null>(null)
  const [showAiModels, setShowAiModels] = useState(false)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set())
  const [semestersMap, setSemestersMap] = useState<Record<number, Semester[]>>({})
  const [subjectsMap, setSubjectsMap] = useState<Record<number, Subject[]>>({})

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    getAllAcademicYears().then(setAcademicYears)
    getUser().then(setUser)
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    updateUser({ theme: next ? "dark" : "light" })
  }

  function refresh() {
    getAllAcademicYears().then(setAcademicYears)
  }

  async function handleDelete() {
    if (!deletingYear) return
    await deleteAcademicYear(deletingYear.id)
    setDeletingYear(null)
    refresh()
  }

  async function toggleYear(year: AcademicYear) {
    const next = new Set(expandedYears)
    if (next.has(year.id)) {
      next.delete(year.id)
    } else {
      next.add(year.id)
      if (!semestersMap[year.id]) {
        const semesters = await getSemestersByYear(year.id)
        setSemestersMap(prev => ({ ...prev, [year.id]: semesters }))
      }
    }
    setExpandedYears(next)
  }

  async function toggleSemester(sem: Semester) {
    const next = new Set(expandedSemesters)
    if (next.has(sem.id)) {
      next.delete(sem.id)
    } else {
      next.add(sem.id)
      if (!subjectsMap[sem.id]) {
        const subjects = await getSubjectsBySemester(sem.id)
        setSubjectsMap(prev => ({ ...prev, [sem.id]: subjects }))
      }
    }
    setExpandedSemesters(next)
  }

  async function refreshSubjects(semId: number) {
    const subjects = await getSubjectsBySemester(semId)
    setSubjectsMap(prev => ({ ...prev, [semId]: subjects }))
  }

  return (
    <>
    <AcademicYearCreation
      open={showCreateYear}
      onOpenChange={setShowCreateYear}
      onCreated={refresh}
    />
    <AcademicYearUpdate
      open={editingYear !== null}
      onOpenChange={open => { if (!open) setEditingYear(null) }}
      year={editingYear}
      onUpdated={refresh}
    />
    <DeleteConfirm
      open={deletingYear !== null}
      onOpenChange={open => { if (!open) setDeletingYear(null) }}
      label={deletingYear?.name}
      onConfirmed={handleDelete}
    />
    <AiModelsPanel
      open={showAiModels}
      onOpenChange={setShowAiModels}
    />
    <Sidebar>
      <SidebarHeader className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Papdex</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-md p-1.5 hover:bg-accent transition-colors"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home className="size-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onShowFavorites}>
                  <Star className="size-4" />
                  <span>Favorites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            Academic Years
            <button
              onClick={() => setShowCreateYear(true)}
              className="rounded p-0.5 hover:bg-accent transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {academicYears.map(year => {
                const yearExpanded = expandedYears.has(year.id)
                const semesters = semestersMap[year.id] ?? []
                return (
                  <div key={year.id}>
                    {/* ── Year row ── */}
                    <SidebarMenuItem
                      onMouseEnter={() => setHoveredYearId(year.id)}
                      onMouseLeave={() => setHoveredYearId(null)}
                    >
                      <SidebarMenuButton onClick={() => onSelectYear(year)}>
                        <button
                          onClick={e => { e.stopPropagation(); toggleYear(year) }}
                          className="flex-shrink-0 rounded p-0.5 hover:bg-accent transition-colors"
                        >
                          {yearExpanded
                            ? <ChevronDown className="size-3.5 text-muted-foreground" />
                            : <ChevronRight className="size-3.5 text-muted-foreground" />
                          }
                        </button>
                        <BookOpen className="size-4 flex-shrink-0" />
                        <span className="flex-1 truncate">{year.name}</span>
                        {hoveredYearId === year.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); setEditingYear(year) }}
                              className="rounded p-0.5 hover:bg-accent transition-colors"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setDeletingYear(year) }}
                              className="rounded p-0.5 hover:bg-destructive/20 text-destructive transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* ── Semester children ── */}
                    {yearExpanded && (
                      <div className="ml-4 pl-2 border-l border-border mt-0.5 mb-1 space-y-0.5">
                        {semesters.length === 0 ? (
                          <p className="px-2 py-1 text-xs text-muted-foreground">No semesters</p>
                        ) : (
                          semesters.map(sem => {
                            const semExpanded = expandedSemesters.has(sem.id)
                            const subjects = subjectsMap[sem.id] ?? []
                            return (
                              <div key={sem.id}>
                                {/* Semester row */}
                                <div className="flex items-center gap-1 px-1 rounded-md hover:bg-accent group">
                                  <button
                                    onClick={() => toggleSemester(sem)}
                                    className="flex-shrink-0 p-0.5 rounded hover:bg-accent transition-colors"
                                  >
                                    {semExpanded
                                      ? <ChevronDown className="size-3 text-muted-foreground" />
                                      : <ChevronRight className="size-3 text-muted-foreground" />
                                    }
                                  </button>
                                  <button
                                    onClick={() => onSelectSemester(year, sem)}
                                    className="flex-1 text-left py-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5 min-w-0"
                                  >
                                    <BookOpen className="size-3 flex-shrink-0" />
                                    <span className="truncate">{sem.name}</span>
                                  </button>
                                </div>

                                {/* Subject children */}
                                {semExpanded && (
                                  <div className="ml-4 pl-2 border-l border-border mt-0.5 mb-1 space-y-0.5">
                                    {subjects.length === 0 ? (
                                      <p className="px-2 py-0.5 text-xs text-muted-foreground/60">No subjects</p>
                                    ) : (
                                      subjects.map(subj => (
                                        <div
                                          key={subj.id}
                                          onClick={() => onSelectSubject(year, sem, subj)}
                                          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                                        >
                                          <FlaskConical className="size-3 flex-shrink-0" />
                                          <span className="truncate">{subj.name}</span>
                                          {subj.is_favorite === 1 && (
                                            <Star className="size-3 ml-auto flex-shrink-0 text-amber-500" fill="currentColor" />
                                          )}
                                        </div>
                                      ))
                                    )}
                                    <button
                                      onClick={() => refreshSubjects(sem.id)}
                                      className="w-full text-left px-2 py-0.5 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                    >
                                      ↻ refresh
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {academicYears.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">No academic years yet</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="size-8 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
            {user?.avatar_path ? (
              <img src={user.avatar_path} alt="avatar" className="size-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {user?.display_name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.display_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Student</p>
          </div>
          {/* Settings */}
          <button
            onClick={() => setShowAiModels(true)}
            className="rounded-md p-1.5 hover:bg-accent transition-colors flex-shrink-0"
          >
            <Settings className="size-4 text-muted-foreground" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
    </>
  )
}
