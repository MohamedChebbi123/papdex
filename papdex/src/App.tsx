import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, type AcademicYear } from "@/components/Sidebar"
import { Academicyeardashaboard } from "@/components/academeic_year_dashboard/file"
import { SemesterDashboard } from "@/components/Semester_dashboard/file"
import { SubjectDashboard } from "@/components/subject_dashboard/file"
import { VirtualFolderDashboard } from "@/components/virtual_folder_dashboard/file"
import { ImportedFolderDashboard } from "@/components/imported_folder_dashboard/file"
import { FavoritesDashboard } from "@/components/favorites_dashboard/file"
import { Onboarding } from "@/components/onboarding/file"
import { getUser } from "@/components/user_service/file"
import type { ImportedFolder } from "@/components/imported_folders_service/file"

type Semester = { id: number; name: string; start_date: string; end_date: string }
type Subject  = { id: number; name: string; is_favorite: number }
type Folder   = { id: number; name: string; is_favorite: number }

function App() {
  const [onboarded,              setOnboarded]              = useState<boolean | null>(null)
  const [selectedYear,           setSelectedYear]           = useState<AcademicYear | null>(null)
  const [selectedSemester,       setSelectedSemester]       = useState<Semester | null>(null)
  const [selectedSubject,        setSelectedSubject]        = useState<Subject | null>(null)
  const [selectedFolder,         setSelectedFolder]         = useState<Folder | null>(null)
  const [selectedImportedFolder, setSelectedImportedFolder] = useState<ImportedFolder | null>(null)
  const [showFavorites,          setShowFavorites]          = useState(false)

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

  if (onboarded === null) return null
  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />

  return (
    <SidebarProvider className="h-screen bg-background">
      <AppSidebar
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
          />
        ) : selectedSemester && selectedYear ? (
          <SemesterDashboard
            semester={selectedSemester}
            year={selectedYear}
            onBack={() => setSelectedSemester(null)}
            onSelectSubject={subj => setSelectedSubject(subj)}
          />
        ) : selectedYear ? (
          <Academicyeardashaboard
            year={selectedYear}
            onSelectSemester={setSelectedSemester}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Select an academic year to get started
          </div>
        )}
      </main>
    </SidebarProvider>
  )
}

export default App
