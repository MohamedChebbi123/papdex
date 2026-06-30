export type User = {
  id: number
  display_name: string
  avatar_path: string | null
  theme: "dark" | "light"
}

export function getUser(): Promise<User> {
  return window.ipcRenderer.invoke("user:get")
}

export function updateUser(fields: Partial<Omit<User, "id">>): Promise<number> {
  return window.ipcRenderer.invoke("user:update", fields)
}
