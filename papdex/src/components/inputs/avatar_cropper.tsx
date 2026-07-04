import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import Cropper from "react-easy-crop"
import { Check, ZoomIn, ZoomOut } from "lucide-react"
import { cropImageToDataUrl, type CropArea } from "@/lib/crop_image"

interface Props {
  imageSrc: string
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

export function AvatarCropper({ imageSrc, onCancel, onConfirm }: Props) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)

  const onCropComplete = useCallback((_: CropArea, pixels: CropArea) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    const dataUrl = await cropImageToDataUrl(imageSrc, croppedAreaPixels)
    onConfirm(dataUrl)
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 100, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <Cropper
          image={imageSrc}
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
          onClick={onCancel}
          style={{ marginInlineStart: 16, background: "#222", border: "1px solid #333", borderRadius: 8, padding: "8px 18px", cursor: "pointer", color: "#aaa", fontSize: 13 }}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            background: "#166534", border: "1px solid #4ade80", borderRadius: 8,
            padding: "8px 20px", cursor: "pointer", color: "#4ade80",
            fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Check size={14} /> {t("onboarding.apply")}
        </button>
      </div>
    </div>
  )
}
