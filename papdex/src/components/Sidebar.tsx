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
import { BookOpen, GraduationCap, Home, Moon, Pencil, Plus, Settings, Star, Sun, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AcademicYearCreation } from "./inputs/Academic_year_creation"
import { AcademicYearUpdate } from "./inputs/Academic_year_update"
import { DeleteConfirm } from "./inputs/Delete_confirm"
import { deleteAcademicYear, getAllAcademicYears } from "./academic_year_service/file"

type AcademicYear = {
  id: number
  name: string
  start_date: string
  end_date: string
}

export type { AcademicYear }

export function AppSidebar({ onSelectYear }: { onSelectYear: (year: AcademicYear) => void }) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [dark, setDark] = useState(false)
  const [showCreateYear, setShowCreateYear] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  const [deletingYear, setDeletingYear] = useState<AcademicYear | null>(null)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  useEffect(() => {
    getAllAcademicYears().then(setAcademicYears)
  }, [])

  function refresh() {
    getAllAcademicYears().then(setAcademicYears)
  }

  async function handleDelete() {
    if (!deletingYear) return
    await deleteAcademicYear(deletingYear.id)
    setDeletingYear(null)
    refresh()
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
    <Sidebar>
      <SidebarHeader className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Papdex</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => setDark(d => !d)}
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
                <SidebarMenuButton>
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
              {academicYears.map(year => (
                <SidebarMenuItem
                  key={year.id}
                  onMouseEnter={() => setHoveredId(year.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <SidebarMenuButton onClick={() => onSelectYear(year)}>
                    <BookOpen className="size-4" />
                    <span>{year.name}</span>
                    {hoveredId === year.id && (
                      <div className="ml-auto flex items-center gap-1">
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
              ))}
              {academicYears.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">No academic years yet</p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </>
  )
}
