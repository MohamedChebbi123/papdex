export type User = {
  id: number
  display_name: string
  avatar_path: string | null
  theme: "dark" | "light"
  onboarded: number
}

export function getUser(): Promise<User> {
  return window.ipcRenderer.invoke("user:get")
}

export function updateUser(fields: Partial<Omit<User, "id">>): Promise<number> {
  return window.ipcRenderer.invoke("user:update", fields)
}

/** Returns a base64 data URL of the chosen image, or null if cancelled. */
export function pickAvatar(): Promise<string | null> {
  return window.ipcRenderer.invoke("user:pickAvatar")
}
