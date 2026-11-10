// Дискотечные лазеры над сценой: тонкие яркие лучи веером, качаются и мигают.
// Чистый CSS (см. .lasers в index.css), без зависимостей.
import type { CSSProperties } from "react"

// a/x — десктоп: базовый угол от вертикали (±45 = под 45° наружу) и старт по
// горизонтали в % ширины фото (края пульта: ~36% и ~69%).
// ma/mx — телефон: в узком окне видна только середина фото (~31–69%), поэтому
// лучи стартуют ближе к центру и веером идут вверх под малым углом.
// s — размах качания, d — период, o — сдвиг фазы.
const BEAMS = [
  { a: -45, ma: -12, s: 6, x: 36, mx: 40, mb: 36, d: 4.6, o: 0, c: "#2ee6ff" },
  { a: -52, ma: -26, s: 5, x: 34, mx: 38, mb: 36, d: 5.2, o: 1.4, c: "#7dff4a" },
  { a: 45, ma: 12, s: 6, x: 69, mx: 64, mb: 44, d: 4.8, o: 0.9, c: "#2ee6ff" },
  { a: 52, ma: 26, s: 5, x: 71, mx: 66, mb: 44, d: 5.4, o: 0.3, c: "#fca305" },
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
              "--da": `${b.a}deg`,
              "--ma": `${b.ma}deg`,
              "--s": `${b.s}deg`,
              "--dx": `${b.x}%`,
              "--mx": `${b.mx}%`,
              "--mb": `${b.mb}%`,
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
