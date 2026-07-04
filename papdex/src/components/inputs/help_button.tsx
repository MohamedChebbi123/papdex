import { HelpCircle } from "lucide-react"

interface Props {
  onClick: () => void
}

export function HelpButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title="Show tutorial"
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
