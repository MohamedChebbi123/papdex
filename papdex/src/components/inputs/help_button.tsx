import { useTranslation } from "react-i18next"
import { HelpCircle } from "lucide-react"

interface Props {
  onClick: () => void
}

export function HelpButton({ onClick }: Props) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      title={t("tour.showTutorial")}
      style={{
        background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
        color: "var(--muted-foreground)", padding: "10px 12px",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
      }}
    >
      <HelpCircle size={14} />
    </button>
  )
}
