import { useTimeline } from "@opentui/react"
import { useEffect, useMemo, useState } from "react"
import { Logo } from "../../ui/logo"

const BAR_WIDTH = 34
const LOADING_ANIMATION_MS = 1200

function buildProgressBar(progress: number): string {
  const normalized = Math.max(0, Math.min(1, progress))
  const cycle = BAR_WIDTH * 2
  const offset = Math.floor(normalized * cycle)
  const head = offset < BAR_WIDTH ? offset : cycle - offset
  const tail = Math.max(0, head - 8)

  let output = ""
  for (let i = 0; i < BAR_WIDTH; i += 1) {
    if (i >= tail && i <= head) {
      output += "█"
      continue
    }

    output += "░"
  }

  return `[${output}]`
}

export function DashboardLoading() {
  const [progress, setProgress] = useState(0)
  const timeline = useTimeline({
    duration: LOADING_ANIMATION_MS,
    loop: true,
  })

  useEffect(() => {
    const target = { value: 0 }

    timeline.add(target, {
      value: 1,
      duration: LOADING_ANIMATION_MS,
      ease: "linear",
      onUpdate: (animation) => {
        const firstTarget = animation.targets[0]
        if (typeof firstTarget !== "object" || firstTarget === null || !("value" in firstTarget)) {
          return
        }

        const nextValue = firstTarget.value
        if (typeof nextValue !== "number") {
          return
        }

        setProgress(nextValue)
      },
    })

    timeline.play()
  }, [])

  const progressBar = useMemo(() => buildProgressBar(progress), [progress])

  return (
    <box flexDirection="column" alignItems="center" justifyContent="center" width="100%" height="100%">
      <Logo />
      <box marginTop={1}>
        <text>
          <span fg="#93C5FD">{progressBar}</span>
        </text>
      </box>
    </box>
  )
}
