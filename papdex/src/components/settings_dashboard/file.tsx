import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ImagePlus, Moon, Settings as SettingsIcon, Sun, Trash2, UserRound } from "lucide-react"
import { getUser, updateUser, pickAvatar, type User, type Language } from "@/components/user_service/file"
import { deleteAllData } from "@/components/data_service/file"
import { AvatarCropper } from "@/components/inputs/avatar_cropper"
import { DeleteConfirm } from "@/components/inputs/Delete_confirm"
import { applyDocumentDirection, RTL_LANGUAGES } from "@/i18n"

const LANGUAGES: Language[] = ["en", "fr", "ar"]

export function SettingsDashboard() {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const [user, setUser]   = useState<User | null>(null)
  const [name, setName]   = useState("")
  const [dark, setDark]   = useState(document.documentElement.classList.contains("dark"))
  const [rawSrc, setRawSrc] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    getUser().then(u => {
      setUser(u)
      setName(u.display_name)
    })
  }, [])

  const muted  = "var(--muted-foreground)"
  const border = "var(--border)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"

  async function handlePickAvatar() {
    const dataUrl = await pickAvatar()
    if (!dataUrl) return
    setRawSrc(dataUrl)
    setShowCropper(true)
  }

  async function handleCropConfirm(dataUrl: string) {
    setShowCropper(false)
    await updateUser({ avatar_path: dataUrl })
    setUser(prev => prev ? { ...prev, avatar_path: dataUrl } : prev)
  }

  function handleCropCancel() {
    setShowCropper(false)
    setRawSrc(null)
  }

  async function handleRemoveAvatar() {
    await updateUser({ avatar_path: null })
    setUser(prev => prev ? { ...prev, avatar_path: null } : prev)
  }

  async function handleSaveName() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === user?.display_name) return
    setSavingName(true)
    try {
      await updateUser({ display_name: trimmed })
      setUser(prev => prev ? { ...prev, display_name: trimmed } : prev)
    } finally {
      setSavingName(false)
    }
  }

  async function handleSelectTheme(theme: "dark" | "light") {
    setDark(theme === "dark")
    document.documentElement.classList.toggle("dark", theme === "dark")
    await updateUser({ theme })
    setUser(prev => prev ? { ...prev, theme } : prev)
  }

  async function handleLanguageChange(language: Language) {
    i18n.changeLanguage(language)
    applyDocumentDirection(language)
    await updateUser({ language })
    setUser(prev => prev ? { ...prev, language } : prev)
  }

  async function handleDeleteAllData() {
    setDeletingAll(true)
    try {
      await deleteAllData()
      window.location.reload()
    } finally {
      setDeletingAll(false)
    }
  }

  if (showCropper && rawSrc) {
    return (
      <AvatarCropper
        imageSrc={rawSrc}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    )
  }

  return (
    <div style={{ padding: "28px 32px", fontFamily: "inherit", maxWidth: 640, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <SettingsIcon size={22} color={muted} />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2, color: fg }}>
            {t("settings.title")}
          </h1>
          <p style={{ color: muted, fontSize: 13, margin: "4px 0 0" }}>
            {t("settings.subtitle")}
          </p>
        </div>
      </div>

      {/* Profile */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: muted, margin: "0 0 18px" }}>
          {t("settings.profileSection")}
        </h2>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <button
            type="button"
            onClick={handlePickAvatar}
            style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              border: `2px dashed ${border}`,
              background: "var(--muted)", cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              overflow: "hidden", padding: 0,
            }}
          >
            {user?.avatar_path ? (
              <img src={user.avatar_path} alt={t("common.avatarAlt")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user ? <UserRound size={26} color={muted} /> : <ImagePlus size={22} color={muted} />
            )}
          </button>
          <div>
            <button
              type="button"
              onClick={handlePickAvatar}
              style={{
                background: "none", border: `1px solid ${border}`, borderRadius: 8,
                color: fg, fontSize: 12, padding: "6px 12px", cursor: "pointer", marginInlineEnd: 8,
              }}
            >
              {t("settings.changePhoto")}
            </button>
            {user?.avatar_path && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                style={{ background: "none", border: "none", color: muted, fontSize: 12, cursor: "pointer" }}
              >
                {t("settings.removePhoto")}
              </button>
            )}
          </div>
        </div>

        <div>
          <label style={{ display: "block", color: muted, fontSize: 12, marginBottom: 6 }}>
            {t("common.name")}
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                flex: 1, boxSizing: "border-box",
                background: "var(--background)", border: `1px solid ${border}`,
                borderRadius: 8, color: fg, fontSize: 14,
                padding: "8px 12px", outline: "none",
              }}
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={savingName || !name.trim() || name.trim() === user?.display_name}
              style={{
                background: "var(--primary)", border: "none", borderRadius: 8,
                color: "var(--primary-foreground)", fontSize: 13, padding: "8px 16px",
                cursor: (savingName || !name.trim() || name.trim() === user?.display_name) ? "not-allowed" : "pointer",
                opacity: (savingName || !name.trim() || name.trim() === user?.display_name) ? 0.5 : 1,
              }}
            >
              {savingName ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: muted, margin: "0 0 18px" }}>
          {t("settings.appearanceSection")}
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: muted, fontSize: 12, marginBottom: 8 }}>
            {t("settings.theme")}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 320 }}>
            {(["dark", "light"] as const).map(themeOption => (
              <button
                key={themeOption}
                type="button"
                onClick={() => handleSelectTheme(themeOption)}
                style={{
                  background: "var(--background)",
                  border: `1px solid ${(dark ? "dark" : "light") === themeOption ? "var(--primary)" : border}`,
                  borderRadius: 10, padding: "10px 0", cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                  color: (dark ? "dark" : "light") === themeOption ? "var(--primary)" : muted,
                }}
              >
                {themeOption === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                <span style={{ fontSize: 12 }}>{t(`settings.${themeOption}`)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: "block", color: muted, fontSize: 12, marginBottom: 8 }}>
            {t("settings.language")}
          </label>
          <div style={{ display: "flex", gap: 8, maxWidth: 320 }} dir={isRTL ? "rtl" : "ltr"}>
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                style={{
                  flex: 1, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 500,
                  cursor: "pointer", textTransform: "uppercase",
                  background: i18n.language === lang ? "var(--primary)" : "var(--background)",
                  color: i18n.language === lang ? "var(--primary-foreground)" : muted,
                  border: `1px solid ${i18n.language === lang ? "var(--primary)" : border}`,
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ background: card, border: "1px solid #ef4444", borderRadius: 14, padding: 24, marginTop: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ef4444", margin: "0 0 18px" }}>
          {t("settings.dangerZoneSection")}
        </h2>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <p style={{ color: fg, fontSize: 13, fontWeight: 500, margin: 0 }}>
              {t("settings.deleteAllData")}
            </p>
            <p style={{ color: muted, fontSize: 12, margin: "4px 0 0" }}>
              {t("settings.deleteAllDataDescription")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteAllOpen(true)}
            disabled={deletingAll}
            style={{
              background: "transparent", border: "1px solid #ef4444", borderRadius: 8,
              color: "#ef4444", fontSize: 12, padding: "8px 16px", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 6,
              cursor: deletingAll ? "not-allowed" : "pointer", opacity: deletingAll ? 0.5 : 1,
            }}
          >
            <Trash2 size={13} />
            {deletingAll ? t("common.deleting") : t("settings.deleteAllData")}
          </button>
        </div>
      </div>

      <DeleteConfirm
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        label={t("settings.deleteAllDataLabel")}
        onConfirmed={handleDeleteAllData}
      />
    </div>
  )
}
