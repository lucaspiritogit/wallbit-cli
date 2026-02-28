import { useEffect, useMemo, useState } from "react"
import { Logo } from "../../ui/logo"

const BAR_WIDTH = 34
const TICK_MS = 70

function buildProgressBar(frame: number): string {
  const cycle = BAR_WIDTH * 2
  const offset = frame % cycle
  const head = offset < BAR_WIDTH ? offset : cycle - offset
  const tail = Math.max(0, head - 8)

  let output = ""
  for (let i = 0; i < BAR_WIDTH; i += 1) {
    if (i >= tail && i <= head) {
      output += "#"
      continue
    }

    output += "-"
  }

  return `[${output}]`
}

export function DashboardLoading() {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((current) => current + 1)
    }, TICK_MS)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const progressBar = useMemo(() => buildProgressBar(frame), [frame])

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
