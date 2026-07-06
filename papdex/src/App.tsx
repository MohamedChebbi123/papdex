import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { GraduationCap } from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { AppSidebar, type AcademicYear, type AppSidebarHandle } from "@/components/Sidebar"
import { Academicyeardashaboard } from "@/components/academeic_year_dashboard/file"
import { SemesterDashboard } from "@/components/Semester_dashboard/file"
import { SubjectDashboard } from "@/components/subject_dashboard/file"
import { VirtualFolderDashboard } from "@/components/virtual_folder_dashboard/file"
import { ImportedFolderDashboard } from "@/components/imported_folder_dashboard/file"
import { FavoritesDashboard } from "@/components/favorites_dashboard/file"
import { SettingsDashboard } from "@/components/settings_dashboard/file"
import { Onboarding } from "@/components/onboarding/file"
import { getUser } from "@/components/user_service/file"
import { openFile, markFileOpened, type SearchResult } from "@/components/file_service/file"
import { openImportedFile, markImportedFileOpened } from "@/components/imported_folders_service/file"
import { applyDocumentDirection } from "@/i18n"
import type { ImportedFolder } from "@/components/imported_folders_service/file"
import logo from "@/assets/papdex logo.png"

type Semester = { id: number; name: string; start_date: string; end_date: string }
type Subject  = { id: number; name: string; is_favorite: number }
type Folder   = { id: number; name: string }

type RecentFileNav = {
  subject: Subject & { semester_id?: number }
  semester: Semester
  folder: Folder | null
  fileId: number
}

function App() {
  const { t, i18n } = useTranslation()
  const [onboarded,              setOnboarded]              = useState<boolean | null>(null)
  const [selectedYear,           setSelectedYear]           = useState<AcademicYear | null>(null)
  const [selectedSemester,       setSelectedSemester]       = useState<Semester | null>(null)
  const [selectedSubject,        setSelectedSubject]        = useState<Subject | null>(null)
  const [selectedFolder,         setSelectedFolder]         = useState<Folder | null>(null)
  const [selectedImportedFolder, setSelectedImportedFolder] = useState<ImportedFolder | null>(null)
  const [showFavorites,          setShowFavorites]          = useState(false)
  const [showSettings,           setShowSettings]           = useState(false)
  const [pendingFileId,          setPendingFileId]          = useState<number | null>(null)
  const sidebarRef = useRef<AppSidebarHandle>(null)
  const handleInitialFileHandled = useCallback(() => setPendingFileId(null), [])

  useEffect(() => {
    getUser().then(user => {
      if (user.onboarded) {
        const cls = document.documentElement.classList
        user.theme === "light" ? cls.remove("dark") : cls.add("dark")
      }
      if (user.language) {
        i18n.changeLanguage(user.language)
        applyDocumentDirection(user.language)
      }
      setOnboarded(!!user.onboarded)
    })
  }, [i18n])

  function handleSelectYear(year: AcademicYear) {
    setSelectedYear(year)
    setSelectedSemester(null)
    setSelectedSubject(null)
    setSelectedFolder(null)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
    setShowSettings(false)
  }

  function handleSelectSemester(year: AcademicYear, semester: Semester) {
    setSelectedYear(year)
    setSelectedSemester(semester)
    setSelectedSubject(null)
    setSelectedFolder(null)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
    setShowSettings(false)
  }

  function handleSelectSubject(year: AcademicYear, semester: Semester, subject: Subject) {
    setSelectedYear(year)
    setSelectedSemester(semester)
    setSelectedSubject(subject)
    setSelectedFolder(null)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
    setShowSettings(false)
  }

  function handleOpenRecentFile({ subject, semester, folder, fileId }: RecentFileNav) {
    setSelectedSemester(semester)
    setSelectedSubject(subject)
    setSelectedFolder(folder)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
    setShowSettings(false)
    setPendingFileId(folder ? fileId : null)
  }

  function handleSelectSearchResult(result: SearchResult) {
    const year:     AcademicYear = { id: result.year_id, name: result.year_name, start_date: result.year_start_date, end_date: result.year_end_date }
    const semester: Semester     = { id: result.semester_id, name: result.semester_name, start_date: result.semester_start_date, end_date: result.semester_end_date }
    const subject:  Subject      = { id: result.subject_id, name: result.subject_name, is_favorite: 0 }

    setSelectedYear(year)
    setSelectedSemester(semester)
    setSelectedSubject(subject)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
    setShowSettings(false)

    if (result.kind === "virtual" && result.folder_id) {
      setSelectedFolder({ id: result.folder_id, name: result.folder_name ?? "" })
      setPendingFileId(result.id)
      return
    }

    setSelectedFolder(null)
    if (result.kind === "virtual") {
      markFileOpened(result.id)
      openFile(result.file_path)
    } else {
      markImportedFileOpened(result.id)
      openImportedFile(result.file_path)
    }
  }

  if (onboarded === null) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
        <img src={logo} alt="Papdex" className="size-16 animate-pulse" />
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-foreground" />
      </div>
    )
  }
  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />

  return (
    <SidebarProvider className="h-screen bg-background">
      <AppSidebar
        ref={sidebarRef}
        onSelectYear={handleSelectYear}
        onSelectSemester={handleSelectSemester}
        onSelectSubject={handleSelectSubject}
        onShowFavorites={() => {
          setShowFavorites(true)
          setShowSettings(false)
          setSelectedYear(null)
          setSelectedSemester(null)
          setSelectedSubject(null)
          setSelectedFolder(null)
          setSelectedImportedFolder(null)
        }}
        onShowSettings={() => {
          setShowSettings(true)
          setShowFavorites(false)
          setSelectedYear(null)
          setSelectedSemester(null)
          setSelectedSubject(null)
          setSelectedFolder(null)
          setSelectedImportedFolder(null)
        }}
        onSelectSearchResult={handleSelectSearchResult}
      />
      <main className="flex-1 overflow-auto bg-background">
        {showSettings ? (
          <SettingsDashboard />
        ) : showFavorites ? (
          <FavoritesDashboard
            onSelectSubject={(subject, semester, year) => {
              setSelectedYear(year)
              setSelectedSemester(semester)
              setSelectedSubject(subject)
              setShowFavorites(false)
            }}
          />
        ) : selectedImportedFolder && selectedSubject && selectedSemester && selectedYear ? (
          <ImportedFolderDashboard
            folderId={selectedImportedFolder.id}
            subject={selectedSubject}
            semester={selectedSemester}
            year={selectedYear}
            onBack={() => setSelectedImportedFolder(null)}
            onBackToSemester={() => { setSelectedSubject(null); setSelectedImportedFolder(null) }}
            onBackToYear={() => { setSelectedSemester(null); setSelectedSubject(null); setSelectedImportedFolder(null) }}
          />
        ) : selectedFolder && selectedSubject && selectedSemester && selectedYear ? (
          <VirtualFolderDashboard
            folderId={selectedFolder.id}
            subject={selectedSubject}
            semester={selectedSemester}
            year={selectedYear}
            initialFileId={pendingFileId}
            onInitialFileHandled={handleInitialFileHandled}
            onSelectFolder={setSelectedFolder}
            onBack={() => setSelectedFolder(null)}
            onBackToSemester={() => { setSelectedSubject(null); setSelectedFolder(null) }}
            onBackToYear={() => { setSelectedSemester(null); setSelectedSubject(null); setSelectedFolder(null) }}
          />
        ) : selectedSubject && selectedSemester && selectedYear ? (
          <SubjectDashboard
            subjectId={selectedSubject.id}
            semester={selectedSemester}
            year={selectedYear}
            onBack={() => setSelectedSubject(null)}
            onBackToYear={() => { setSelectedSemester(null); setSelectedSubject(null) }}
            onSelectFolder={setSelectedFolder}
            onSelectImportedFolder={setSelectedImportedFolder}
            onOpenFile={handleOpenRecentFile}
          />
        ) : selectedSemester && selectedYear ? (
          <SemesterDashboard
            semester={selectedSemester}
            year={selectedYear}
            onBack={() => setSelectedSemester(null)}
            onSelectSubject={subj => setSelectedSubject(subj)}
            onOpenFile={handleOpenRecentFile}
          />
        ) : selectedYear ? (
          <Academicyeardashaboard
            year={selectedYear}
            onSelectSemester={setSelectedSemester}
            onSelectSubject={handleSelectSubject}
            onOpenFile={handleOpenRecentFile}
          />
        ) : (
          <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-6">
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute -top-[10%] -right-[5%] size-[400px] rounded-full bg-primary/30 blur-[120px]" />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3 text-center max-w-sm">
              <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-muted border border-border">
                <GraduationCap className="size-7 text-muted-foreground/60" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xl font-bold tracking-tight">{t("app.noYearTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("app.noYearSubtitle")}
                </p>
              </div>
              <Button
                className="mt-2 shadow-lg shadow-primary/20"
                onClick={() => sidebarRef.current?.openCreateYear()}
              >
                {t("app.createYear")}
              </Button>
            </div>
          </div>
        )}
      </main>
    </SidebarProvider>
  )
}

export default App
