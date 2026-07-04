import { useState, useEffect, useRef } from "react"
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
import { Onboarding } from "@/components/onboarding/file"
import { getUser } from "@/components/user_service/file"
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
  const [onboarded,              setOnboarded]              = useState<boolean | null>(null)
  const [selectedYear,           setSelectedYear]           = useState<AcademicYear | null>(null)
  const [selectedSemester,       setSelectedSemester]       = useState<Semester | null>(null)
  const [selectedSubject,        setSelectedSubject]        = useState<Subject | null>(null)
  const [selectedFolder,         setSelectedFolder]         = useState<Folder | null>(null)
  const [selectedImportedFolder, setSelectedImportedFolder] = useState<ImportedFolder | null>(null)
  const [showFavorites,          setShowFavorites]          = useState(false)
  const [pendingFileId,          setPendingFileId]          = useState<number | null>(null)
  const sidebarRef = useRef<AppSidebarHandle>(null)

  useEffect(() => {
    getUser().then(user => {
      if (user.onboarded) {
        const cls = document.documentElement.classList
        user.theme === "light" ? cls.remove("dark") : cls.add("dark")
      }
      setOnboarded(!!user.onboarded)
    })
  }, [])

  function handleSelectYear(year: AcademicYear) {
    setSelectedYear(year)
    setSelectedSemester(null)
    setSelectedSubject(null)
    setSelectedFolder(null)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
  }

  function handleSelectSemester(year: AcademicYear, semester: Semester) {
    setSelectedYear(year)
    setSelectedSemester(semester)
    setSelectedSubject(null)
    setSelectedFolder(null)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
  }

  function handleSelectSubject(year: AcademicYear, semester: Semester, subject: Subject) {
    setSelectedYear(year)
    setSelectedSemester(semester)
    setSelectedSubject(subject)
    setSelectedFolder(null)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
  }

  function handleOpenRecentFile({ subject, semester, folder, fileId }: RecentFileNav) {
    setSelectedSemester(semester)
    setSelectedSubject(subject)
    setSelectedFolder(folder)
    setSelectedImportedFolder(null)
    setShowFavorites(false)
    setPendingFileId(folder ? fileId : null)
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
          setSelectedYear(null)
          setSelectedSemester(null)
          setSelectedSubject(null)
          setSelectedFolder(null)
          setSelectedImportedFolder(null)
        }}
      />
      <main className="flex-1 overflow-auto bg-background">
        {showFavorites ? (
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
            onInitialFileHandled={() => setPendingFileId(null)}
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
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
            <div className="rounded-full bg-muted p-4">
              <GraduationCap className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No academic year selected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create an academic year to start organizing your semesters, subjects, and files.
              </p>
            </div>
            <Button size="sm" onClick={() => sidebarRef.current?.openCreateYear()}>
              Create academic year
            </Button>
          </div>
        )}
      </main>
    </SidebarProvider>
  )
}

export default App
