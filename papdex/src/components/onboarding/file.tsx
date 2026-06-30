import { useState, useCallback, useEffect } from "react"
import Cropper from "react-easy-crop"
import { UserRound, Sun, Moon, ImagePlus, ArrowRight, Check, ZoomIn, ZoomOut } from "lucide-react"
import { updateUser, pickAvatar } from "@/components/user_service/file"

type Area = { x: number; y: number; width: number; height: number }

async function cropImageToDataUrl(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })
  const canvas = document.createElement("canvas")
  canvas.width  = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return canvas.toDataURL("image/jpeg", 0.9)
}

interface Props {
  onDone: () => void
}

export function Onboarding({ onDone }: Props) {
  const [name, setName]                 = useState("")
  const [theme, setTheme]               = useState<"dark" | "light">("dark")
  const [rawSrc, setRawSrc]             = useState<string | null>(null)
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper]   = useState(false)
  const [crop, setCrop]                 = useState({ x: 0, y: 0 })
  const [zoom, setZoom]                 = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
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
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setShowCropper(true)
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleCropConfirm() {
    if (!rawSrc || !croppedAreaPixels) return
    const dataUrl = await cropImageToDataUrl(rawSrc, croppedAreaPixels)
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
      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Cropper
            image={rawSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        {/* Zoom controls */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          padding: "16px 24px", background: "#111",
        }}>
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(1, z - 0.1))}
            style={{ background: "#222", border: "1px solid #333", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex", color: "#fff" }}
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ width: 160, accentColor: "#4ade80" }}
          />
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3, z + 0.1))}
            style={{ background: "#222", border: "1px solid #333", borderRadius: 8, padding: 8, cursor: "pointer", display: "flex", color: "#fff" }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            onClick={handleCropCancel}
            style={{ marginLeft: 16, background: "#222", border: "1px solid #333", borderRadius: 8, padding: "8px 18px", cursor: "pointer", color: "#aaa", fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropConfirm}
            style={{
              background: "#166534", border: "1px solid #4ade80", borderRadius: 8,
              padding: "8px 20px", cursor: "pointer", color: "#4ade80",
              fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Check size={14} /> Apply
          </button>
        </div>
      </div>
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
            Welcome to Papdex
          </h1>
          <p style={{ color: muted, fontSize: 14, margin: 0 }}>
            Let's set up your profile before you get started.
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
              <img src={croppedDataUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <ImagePlus size={22} color={muted} />
                <span style={{ color: muted, fontSize: 10 }}>Add photo</span>
              </>
            )}
          </button>
          {croppedDataUrl && (
            <button
              type="button"
              onClick={() => { setCroppedDataUrl(null); setRawSrc(null) }}
              style={{ background: "none", border: "none", color: muted, fontSize: 11, marginTop: 6, cursor: "pointer" }}
            >
              Remove
            </button>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", color: muted, fontSize: 12, marginBottom: 6 }}>
            Your name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mohamed"
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
            Theme preference
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(["dark", "light"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                style={{
                  background: card,
                  border: `1px solid ${theme === t ? "#4ade80" : border}`,
                  borderRadius: 10, padding: "12px 0", cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 6,
                  color: theme === t ? "#4ade80" : muted,
                }}
              >
                {t === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                <span style={{ fontSize: 12, textTransform: "capitalize" }}>{t}</span>
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
          {loading ? "Setting up…" : "Get started"}
          {!loading && <ArrowRight size={16} />}
        </button>

      </form>
    </div>
  )
}
