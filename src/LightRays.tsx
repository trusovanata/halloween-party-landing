// Light Rays — на основе Magic UI (MIT), переписан на обычный CSS без Tailwind/cn.
// Лучи «светят сверху» и мягко качаются, как дискотечные прожекторы.
import { useEffect, useState, type CSSProperties } from "react"
import { motion, useReducedMotion } from "motion/react"

type Ray = {
  id: string
  left: number
  rotate: number
  width: number
  swing: number
  delay: number
  duration: number
  intensity: number
  color: string
}

const createRays = (count: number, cycle: number, colors: string[]): Ray[] =>
  Array.from({ length: count }, (_, index) => {
    const left = 8 + Math.random() * 84
    return {
      id: `${index}-${Math.round(left * 10)}`,
      left,
      rotate: -28 + Math.random() * 56,
      width: 5 + Math.random() * 5, // cqw
      swing: 2 + Math.random() * 4,
      delay: Math.random() * cycle,
      duration: cycle * (0.75 + Math.random() * 0.5),
      intensity: 0.6 + Math.random() * 0.4,
      color: colors[index % colors.length],
    }
  })

type Props = {
  count?: number
  colors?: string[]
  blur?: number
  speed?: number
}

export function LightRays({
  count = 7,
  colors = ["rgba(252, 163, 5, 0.55)", "rgba(40, 190, 230, 0.55)"],
  blur = 22,
  speed = 9,
}: Props) {
  const reduce = useReducedMotion()
  const [rays, setRays] = useState<Ray[]>([])

  useEffect(() => {
    setRays(createRays(count, Math.max(speed, 0.1), colors))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, speed])

  if (reduce) return null

  return (
    <div
      aria-hidden="true"
      className="light-rays"
      style={{ "--rays-blur": `${blur}px` } as CSSProperties}
    >
      {rays.map((ray) => (
        <motion.span
          className="light-rays__ray"
          key={ray.id}
          style={
            {
              "--ray-left": `${ray.left}%`,
              "--ray-width": `${ray.width}cqw`,
              "--ray-color": ray.color,
            } as CSSProperties
          }
          initial={{ rotate: ray.rotate }}
          animate={{
            opacity: [0, ray.intensity, 0],
            rotate: [ray.rotate - ray.swing, ray.rotate + ray.swing, ray.rotate - ray.swing],
          }}
          transition={{
            duration: ray.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: ray.delay,
            repeatDelay: ray.duration * 0.1,
          }}
        />
      ))}
    </div>
  )
}
