import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, type AcademicYear } from "@/components/Sidebar"
import { Academicyeardashaboard } from "@/components/academeic_year_dashboard/file"

function App() {
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null)

  return (
    <SidebarProvider className="h-screen bg-background">
      <AppSidebar onSelectYear={setSelectedYear} />
      <main className="flex-1 overflow-auto bg-background">
        {selectedYear
          ? <Academicyeardashaboard year={selectedYear} />
          : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Select an academic year to get started
            </div>
          )
        }
      </main>
    </SidebarProvider>
  )
}

export default App
