import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, type AcademicYear } from "@/components/Sidebar"
import { Academicyeardashaboard } from "@/components/academeic_year_dashboard/file"
import { SemesterDashboard } from "@/components/Semester_dashboard/file"

type Semester = { id: number; name: string; start_date: string; end_date: string }

function App() {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null)

  function handleSelectYear(year: AcademicYear) {
    setSelectedYear(year)
    setSelectedSemester(null)
  }

  return (
    <SidebarProvider className="h-screen bg-background">
      <AppSidebar onSelectYear={handleSelectYear} />
      <main className="flex-1 overflow-auto bg-background">
        {selectedSemester && selectedYear ? (
          <SemesterDashboard
            semester={selectedSemester}
            year={selectedYear}
            onBack={() => setSelectedSemester(null)}
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
