import { Joyride, STATUS, type Step } from "react-joyride"

interface Props {
  steps: Step[]
  run: boolean
  onFinish: () => void
}

export function TourGuide({ steps, run, onFinish }: Props) {
  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      options={{
        primaryColor: "#6366f1",
        backgroundColor: "var(--card)",
        textColor: "var(--foreground)",
        arrowColor: "var(--card)",
        overlayColor: "rgba(0, 0, 0, 0.6)",
        zIndex: 10000,
        showProgress: true,
        skipBeacon: true,
        buttons: ["back", "skip", "close", "primary"],
      }}
      styles={{
        tooltip: { borderRadius: 12, border: "1px solid var(--border)", fontFamily: "inherit" },
        tooltipTitle: { fontSize: 14, fontWeight: 600 },
        tooltipContent: { fontSize: 13, padding: "8px 0" },
        buttonBack: { color: "var(--muted-foreground)" },
        buttonSkip: { color: "var(--muted-foreground)" },
      }}
      onEvent={({ status }) => {
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
          onFinish()
        }
      }}
    />
  )
}
