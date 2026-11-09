// Дискотечные лазеры над сценой: тонкие яркие лучи веером, качаются и мигают.
// Чистый CSS (см. .lasers в index.css), без зависимостей.
import type { CSSProperties } from "react"

// a — базовый угол от вертикали (±45 = под 45° наружу), s — размах качания,
// x — старт по горизонтали в % ширины фото (края пульта: ~36% и ~69%), d — период, o — сдвиг фазы.
const BEAMS = [
  { a: -45, s: 6, x: 36, d: 4.6, o: 0, c: "#2ee6ff" },
  { a: -52, s: 5, x: 34, d: 5.2, o: 1.4, c: "#7dff4a" },
  { a: 45, s: 6, x: 69, d: 4.8, o: 0.9, c: "#2ee6ff" },
  { a: 52, s: 5, x: 71, d: 5.4, o: 0.3, c: "#fca305" },
]

export function Lasers() {
  return (
    <div aria-hidden="true" className="lasers">
      {BEAMS.map((b) => (
        <span
          className="lasers__beam"
          key={b.a}
          style={
            {
              "--a": `${b.a}deg`,
              "--s": `${b.s}deg`,
              "--x": `${b.x}%`,
              "--c": b.c,
              animationDuration: `${b.d}s, ${b.d * 0.37}s`,
              animationDelay: `-${b.o * 2}s, -${b.o}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
