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
  BookOpen, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  GraduationCap, Home, Pencil,
  Plus, Search, Settings, Star, Trash2, FlaskConical, Tag, X,
} from "lucide-react"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { useTranslation } from "react-i18next"
import { RTL_LANGUAGES } from "@/i18n"
import { AcademicYearCreation } from "./inputs/Academic_year_creation"
import { AcademicYearUpdate } from "./inputs/Academic_year_update"
import { DeleteConfirm } from "./inputs/Delete_confirm"
import { deleteAcademicYear, getAllAcademicYears } from "./academic_year_service/file"
import { getSemestersByYear } from "./semester_service/file"
import { getSubjectsBySemester } from "./subjects_service/file"
import { getUser, type User } from "./user_service/file"
import { searchFiles, getSearchFilterOptions, type SearchResult, type SearchFilterOptions } from "./file_service/file"
import { categoryLabel } from "@/lib/category_label"

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

export interface AppSidebarHandle {
  openCreateYear: () => void
}

interface Props {
  onSelectYear: (year: AcademicYear) => void
  onSelectSemester: (year: AcademicYear, semester: Semester) => void
  onSelectSubject: (year: AcademicYear, semester: Semester, subject: Subject) => void
  onShowFavorites: () => void
  onShowSettings: () => void
  onSelectSearchResult: (result: SearchResult) => void
}

export const AppSidebar = forwardRef<AppSidebarHandle, Props>(function AppSidebar(
  { onSelectYear, onSelectSemester, onSelectSubject, onShowFavorites, onShowSettings, onSelectSearchResult },
  ref
) {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const CollapsedChevron = isRTL ? ChevronLeft : ChevronRight
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [showCreateYear, setShowCreateYear] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [deletingYear, setDeletingYear] = useState<AcademicYear | null>(null)
  const [hoveredYearId, setHoveredYearId] = useState<number | null>(null)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set())
  const [semestersMap, setSemestersMap] = useState<Record<number, Semester[]>>({})
  const [subjectsMap, setSubjectsMap] = useState<Record<number, Subject[]>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchFilterOptions, setSearchFilterOptions] = useState<SearchFilterOptions | null>(null)
  const [searchSubjectId, setSearchSubjectId] = useState<number | "">("")
  const [searchSemesterId, setSearchSemesterId] = useState<number | "">("")
  const [searchFileType, setSearchFileType] = useState("")

  useImperativeHandle(ref, () => ({
    openCreateYear: () => setShowCreateYear(true),
  }))

  useEffect(() => {
    getAllAcademicYears().then(setAcademicYears)
    getUser().then(setUser)
    getSearchFilterOptions().then(setSearchFilterOptions)
  }, [])

  const hasSearchFilters = searchSubjectId !== "" || searchSemesterId !== "" || searchFileType !== ""

  useEffect(() => {
    const term = searchQuery.trim()
    if (!term && !hasSearchFilters) {
      setSearchResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const handle = setTimeout(() => {
      searchFiles(term, {
        subjectId: searchSubjectId === "" ? null : searchSubjectId,
        semesterId: searchSemesterId === "" ? null : searchSemesterId,
        fileType: searchFileType === "" ? null : searchFileType,
      }).then(results => {
        setSearchResults(results)
        setSearching(false)
      })
    }, 250)
    return () => clearTimeout(handle)
  }, [searchQuery, searchSubjectId, searchSemesterId, searchFileType, hasSearchFilters])

  function handleSelectResult(result: SearchResult) {
    onSelectSearchResult(result)
    setSearchQuery("")
    setSearchResults([])
  }

  function clearSearchFilters() {
    setSearchSemesterId("")
    setSearchSubjectId("")
    setSearchFileType("")
  }

  const searchActive = searchQuery.trim().length > 0 || hasSearchFilters
  const filteredSearchSubjects = (searchFilterOptions?.subjects ?? []).filter(
    subj => searchSemesterId === "" || subj.semester_id === searchSemesterId
  )

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
    <Sidebar side={isRTL ? "right" : "left"}>
      <SidebarHeader className="px-4 py-3 border-b space-y-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Papdex</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(i18n.language)}</p>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t("sidebar.searchPlaceholder")}
            className="w-full rounded-md border border-input bg-background ps-8 pe-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
          />

          <div className="mt-1.5 flex items-center gap-1">
            <div className="relative min-w-0 flex-1">
              <Calendar className="pointer-events-none absolute start-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/70" />
              <select
                value={searchSemesterId}
                onChange={e => {
                  const value = e.target.value === "" ? "" : Number(e.target.value)
                  setSearchSemesterId(value)
                  setSearchSubjectId("")
                }}
                title={
                  searchSemesterId === ""
                    ? t("sidebar.searchAllSemesters")
                    : `${(searchFilterOptions?.semesters ?? []).find(s => s.id === searchSemesterId)?.year_name} · ${(searchFilterOptions?.semesters ?? []).find(s => s.id === searchSemesterId)?.name}`
                }
                className={`w-full min-w-0 appearance-none truncate rounded-md border py-1 ps-5 pe-4 text-[10px] outline-none transition-colors focus:ring-1 focus:ring-ring ${
                  searchSemesterId !== ""
                    ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                    : "border-input bg-background text-muted-foreground"
                }`}
              >
                <option value="">{t("sidebar.searchAllSemesters")}</option>
                {(searchFilterOptions?.semesters ?? []).map(sem => (
                  <option key={sem.id} value={sem.id}>{sem.year_name} · {sem.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-1 top-1/2 size-2.5 -translate-y-1/2 text-muted-foreground/70" />
            </div>

            <div className="relative min-w-0 flex-1">
              <FlaskConical className="pointer-events-none absolute start-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/70" />
              <select
                value={searchSubjectId}
                onChange={e => setSearchSubjectId(e.target.value === "" ? "" : Number(e.target.value))}
                title={
                  searchSubjectId === ""
                    ? t("sidebar.searchAllSubjects")
                    : filteredSearchSubjects.find(s => s.id === searchSubjectId)?.name
                }
                className={`w-full min-w-0 appearance-none truncate rounded-md border py-1 ps-5 pe-4 text-[10px] outline-none transition-colors focus:ring-1 focus:ring-ring ${
                  searchSubjectId !== ""
                    ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                    : "border-input bg-background text-muted-foreground"
                }`}
              >
                <option value="">{t("sidebar.searchAllSubjects")}</option>
                {filteredSearchSubjects.map(subj => (
                  <option key={subj.id} value={subj.id}>{subj.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-1 top-1/2 size-2.5 -translate-y-1/2 text-muted-foreground/70" />
            </div>

            <div className="relative min-w-0 flex-1">
              <Tag className="pointer-events-none absolute start-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/70" />
              <select
                value={searchFileType}
                onChange={e => setSearchFileType(e.target.value)}
                title={searchFileType === "" ? t("sidebar.searchAllTypes") : categoryLabel(t, searchFileType)}
                className={`w-full min-w-0 appearance-none truncate rounded-md border py-1 ps-5 pe-4 text-[10px] outline-none transition-colors focus:ring-1 focus:ring-ring ${
                  searchFileType !== ""
                    ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                    : "border-input bg-background text-muted-foreground"
                }`}
              >
                <option value="">{t("sidebar.searchAllTypes")}</option>
                {(searchFilterOptions?.types ?? []).map(type => (
                  <option key={type} value={type}>{categoryLabel(t, type)}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute end-1 top-1/2 size-2.5 -translate-y-1/2 text-muted-foreground/70" />
            </div>

            {hasSearchFilters && (
              <button
                onClick={clearSearchFilters}
                title={t("sidebar.searchClearFilters")}
                className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {searchActive && (
            <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-md border bg-popover shadow-md">
              {searching ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">{t("common.loading")}</p>
              ) : searchResults.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">{t("sidebar.searchEmpty")}</p>
              ) : (
                searchResults.map(result => (
                  <button
                    key={`${result.kind}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className="w-full border-b text-start px-3 py-2 last:border-b-0 hover:bg-accent transition-colors"
                  >
                    <p className="truncate text-xs font-medium">{result.file_name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {result.year_name} · {result.semester_name} · {result.subject_name}
                      {result.folder_name ? ` · ${result.folder_name}` : ""}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home className="size-4" />
                  <span>{t("sidebar.home")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onShowFavorites}>
                  <Star className="size-4" />
                  <span>{t("sidebar.favorites")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            {t("sidebar.academicYears")}
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
                            : <CollapsedChevron className="size-3.5 text-muted-foreground" />
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
                      <div className="ms-4 ps-2 border-s border-border mt-0.5 mb-1 space-y-0.5">
                        {semesters.length === 0 ? (
                          <p className="px-2 py-1 text-xs text-muted-foreground">{t("sidebar.noSemesters")}</p>
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
                                      : <CollapsedChevron className="size-3 text-muted-foreground" />
                                    }
                                  </button>
                                  <button
                                    onClick={() => onSelectSemester(year, sem)}
                                    className="flex-1 text-start py-1.5 text-xs text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5 min-w-0"
                                  >
                                    <BookOpen className="size-3 flex-shrink-0" />
                                    <span className="truncate">{sem.name}</span>
                                  </button>
                                </div>

                                {/* Subject children */}
                                {semExpanded && (
                                  <div className="ms-4 ps-2 border-s border-border mt-0.5 mb-1 space-y-0.5">
                                    {subjects.length === 0 ? (
                                      <p className="px-2 py-0.5 text-xs text-muted-foreground/60">{t("sidebar.noSubjects")}</p>
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
                                            <Star className="size-3 ms-auto flex-shrink-0 text-amber-500" fill="currentColor" />
                                          )}
                                        </div>
                                      ))
                                    )}
                                    <button
                                      onClick={() => refreshSubjects(sem.id)}
                                      className="w-full text-start px-2 py-0.5 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                    >
                                      ↻ {t("sidebar.refresh")}
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
                <p className="px-2 py-1 text-xs text-muted-foreground">{t("sidebar.noAcademicYears")}</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <button
          onClick={onShowSettings}
          className="flex w-full items-center gap-3 rounded-md p-1 -m-1 hover:bg-accent transition-colors"
        >
          {/* Avatar */}
          <div className="size-8 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
            {user?.avatar_path ? (
              <img src={user.avatar_path} alt={t("common.avatarAlt")} className="size-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">
                {user?.display_name?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          {/* Name */}
          <div className="flex-1 min-w-0 text-start">
            <p className="text-sm font-medium truncate">{user?.display_name ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{t("common.student")}</p>
          </div>
          <Settings className="size-4 text-muted-foreground flex-shrink-0" />
        </button>
      </SidebarFooter>
    </Sidebar>
    </>
  )
})
