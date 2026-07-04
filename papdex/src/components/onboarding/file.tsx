import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { UserRound, Sun, Moon, ImagePlus, ArrowRight, ArrowLeft } from "lucide-react"
import { updateUser, pickAvatar } from "@/components/user_service/file"
import { AvatarCropper } from "@/components/inputs/avatar_cropper"
import { RTL_LANGUAGES } from "@/i18n"

interface Props {
  onDone: () => void
}

export function Onboarding({ onDone }: Props) {
  const { t, i18n } = useTranslation()
  const isRTL = RTL_LANGUAGES.has(i18n.language)
  const StartArrow = isRTL ? ArrowLeft : ArrowRight
  const [name, setName]                 = useState("")
  const [theme, setTheme]               = useState<"dark" | "light">("dark")
  const [rawSrc, setRawSrc]             = useState<string | null>(null)
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper]   = useState(false)
  const [loading, setLoading]           = useState(false)

  // Apply theme in real-time as user toggles
  useEffect(() => {
    const cls = document.documentElement.classList
    theme === "dark" ? cls.add("dark") : cls.remove("dark")
  }, [theme])

  const border = "var(--border)"
  const muted  = "var(--muted-foreground)"
  const card   = "var(--card)"
  const fg     = "var(--foreground)"
  const bg     = "var(--background)"

  async function handlePickAvatar() {
    const dataUrl = await pickAvatar()
    if (!dataUrl) return
    setRawSrc(dataUrl)
    setShowCropper(true)
  }

  function handleCropConfirm(dataUrl: string) {
    setCroppedDataUrl(dataUrl)
    setShowCropper(false)
  }

  function handleCropCancel() {
    setShowCropper(false)
    setRawSrc(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await updateUser({
        display_name: name.trim(),
        avatar_path: croppedDataUrl,
        theme,
        onboarded: 1,
      })
      onDone()
    } finally {
      setLoading(false)
    }
  }

  // ── Cropper overlay ──────────────────────────────────────────────────────
  if (showCropper && rawSrc) {
    return (
      <AvatarCropper
        imageSrc={rawSrc}
        onCancel={handleCropCancel}
        onConfirm={handleCropConfirm}
      />
    )
  }

  // ── Main onboarding form ─────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "#166534", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
          }}>
            <UserRound size={26} color="#4ade80" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: fg, margin: "0 0 6px" }}>
            {t("onboarding.title")}
          </h1>
          <p style={{ color: muted, fontSize: 14, margin: 0 }}>
            {t("onboarding.subtitle")}
          </p>
        </div>

        {/* Avatar picker */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <button
            type="button"
            onClick={handlePickAvatar}
            style={{
              width: 88, height: 88, borderRadius: "50%",
              border: `2px dashed ${croppedDataUrl ? "#4ade80" : border}`,
              background: card, cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              overflow: "hidden", padding: 0,
            }}
          >
            {croppedDataUrl ? (
              <img src={croppedDataUrl} alt={t("common.avatarAlt")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <ImagePlus size={22} color={muted} />
                <span style={{ color: muted, fontSize: 10 }}>{t("onboarding.addPhoto")}</span>
              </>
            )}
          </button>
          {croppedDataUrl && (
            <button
              type="button"
              onClick={() => { setCroppedDataUrl(null); setRawSrc(null) }}
              style={{ background: "none", border: "none", color: muted, fontSize: 11, marginTop: 6, cursor: "pointer" }}
            >
              {t("onboarding.remove")}
            </button>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: muted, fontSize: 12, marginBottom: 6 }}>
            {t("onboarding.yourName")}
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t("onboarding.namePlaceholder")}
            required
            style={{
              width: "100%", boxSizing: "border-box",
              background: card, border: `1px solid ${border}`,
              borderRadius: 10, color: fg, fontSize: 14,
              padding: "10px 14px", outline: "none",
            }}
          />
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", color: muted, fontSize: 12, marginBottom: 8 }}>
            {t("onboarding.themePreference")}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["dark", "light"] as const).map(themeOption => (
              <button
                key={themeOption}
                type="button"
                onClick={() => setTheme(themeOption)}
                style={{
                  background: card,
                  border: `1px solid ${theme === themeOption ? "#4ade80" : border}`,
                  borderRadius: 10, padding: "12px 0", cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                  color: theme === themeOption ? "#4ade80" : muted,
                }}
              >
                {themeOption === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                <span style={{ fontSize: 12, textTransform: "capitalize" }}>{t(`onboarding.${themeOption}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!name.trim() || loading}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10,
            background: name.trim() ? "#166534" : card,
            border: `1px solid ${name.trim() ? "#4ade80" : border}`,
            color: name.trim() ? "#4ade80" : muted,
            fontSize: 14, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.15s",
          }}
        >
          {loading ? t("onboarding.settingUp") : t("onboarding.getStarted")}
          {!loading && <StartArrow size={16} />}
        </button>

      </form>
    </div>
  )
}
