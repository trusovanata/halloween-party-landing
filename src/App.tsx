import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react"

const A = "/assets"
const MARQUEE_UNIT =
  "DRESS TO KILL · OCTOBER 31 · 17:00 · DANCE MORE · DRESS TO KILL · OCTOBER 31 · 17:00 · DANCE MORE · "
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const
const revealItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: REVEAL_EASE },
  },
}
const heroStagger = {
  hidden: {},
  visible: {
    transition: { delayChildren: 0.04, staggerChildren: 0.09 },
  },
}

function getCountdown() {
  const now = new Date()
  let eventDate = new Date(`${now.getFullYear()}-10-31T17:00:00+02:00`)

  if (eventDate.getTime() <= now.getTime()) {
    eventDate = new Date(`${now.getFullYear() + 1}-10-31T17:00:00+02:00`)
  }

  const totalSeconds = Math.max(
    0,
    Math.floor((eventDate.getTime() - now.getTime()) / 1000),
  )
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    [String(days).padStart(2, "0"), "Days"],
    [String(hours).padStart(2, "0"), "Hours"],
    [String(minutes).padStart(2, "0"), "Minutes"],
    [String(seconds).padStart(2, "0"), "Seconds"],
  ]
}

function Button({
  children,
  href = "#rsvp",
  className = "",
}: {
  children: React.ReactNode
  href?: string
  className?: string
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.a
      className={`button ${className}`}
      href={href}
      variants={revealItem}
      whileHover={
        shouldReduceMotion
          ? undefined
          : { scale: 1.025, boxShadow: "0 0 18px rgba(252, 163, 5, 0.3)" }
      }
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.a>
  )
}

function Fade({ direction = "top" }: { direction?: "top" | "bottom" }) {
  return <span aria-hidden="true" className={`fade fade--${direction}`} />
}

function SplitLetters({
  text,
  delay = 0,
  bounce = false,
}: {
  text: string
  delay?: number
  bounce?: boolean
}) {
  const shouldReduceMotion = useReducedMotion()
  if (shouldReduceMotion) return <>{text}</>

  const words = text.split(" ")
  let index = 0
  // Каждая буква — отдельный inline-block, а у блоков нет кернинга шрифта:
  // строка получалась на ~0.0145em на букву шире и вылезала за край колонки.
  // Отрицательный margin возвращает прежнюю ширину.

  return (
    <span aria-label={text}>
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`}>
          <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
            {[...word].map((char, charIndex) => {
              const i = index++
              return (
                <motion.span
                  aria-hidden="true"
                  initial={
                    bounce
                      ? { opacity: 0, y: 50 }
                      : { opacity: 0, y: 60 }
                  }
                  key={`${char}-${charIndex}`}
                  style={{ display: "inline-block", marginRight: "-0.0145em" }}
                  transition={
                    bounce
                      ? {
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: delay + i * 0.05,
                        }
                      : {
                          duration: 0.7,
                          ease: REVEAL_EASE,
                          delay: delay + i * 0.06,
                        }
                  }
                  viewport={{ once: true, amount: 0.3 }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  {char}
                </motion.span>
              )
            })}
          </span>
          {wordIndex < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  )
}

export default function App() {
  const backgroundAudio = useRef<HTMLAudioElement>(null)
  const heroSection = useRef<HTMLElement>(null)
  const pumpkinMotion = useRef<HTMLDivElement>(null)
  const pumpkinVideo = useRef<HTMLVideoElement>(null)
  const raveVideo = useRef<HTMLVideoElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const slideIn = (from: "left" | "right", delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, x: from === "left" ? -90 : 90 },
          transition: { duration: 0.8, ease: REVEAL_EASE, delay },
          viewport: { once: true, amount: 0.4 },
          whileInView: { opacity: 1, x: 0 },
        }
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const cursorRotateX = useMotionValue(0)
  const cursorRotateY = useMotionValue(0)
  const springConfig = { stiffness: 85, damping: 20, mass: 0.8 }
  const pumpkinX = useSpring(cursorX, springConfig)
  const pumpkinY = useSpring(cursorY, springConfig)
  const pumpkinRotateX = useSpring(cursorRotateX, springConfig)
  const pumpkinRotateY = useSpring(cursorRotateY, springConfig)
  const [hasFinePointer, setHasFinePointer] = useState(false)
  const [pumpkinPlaybackBlocked, setPumpkinPlaybackBlocked] = useState(false)
  const [pumpkinReady, setPumpkinReady] = useState(false)
  const [pumpkinVideoError, setPumpkinVideoError] = useState<string | null>(
    null,
  )
  const [heroInView, setHeroInView] = useState(true)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [isRavePlaying, setIsRavePlaying] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(getCountdown)

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (backgroundAudio.current) backgroundAudio.current.volume = 0.32
  }, [])

  useEffect(() => {
    const section = heroSection.current
    if (!section) return

    // CTA первого экрана: виден на самом верху и пока низ hero не поднялся
    // до зоны кнопки (~96px от нижнего края) — дальше она не должна висеть
    // поверх следующей секции.
    const update = () => {
      const { bottom } = section.getBoundingClientRect()
      setHeroInView(window.scrollY < 8 || bottom > window.innerHeight - 96)
    }

    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [])

  const toggleSiteAudio = async () => {
    const audio = backgroundAudio.current
    if (!audio) return

    if (audio.paused) {
      try {
        await audio.play()
      } catch (error) {
        console.warn("Background audio playback was blocked.", error)
      }
    } else {
      audio.pause()
    }
  }

  const startPumpkinVideo = useCallback(async () => {
    const video = pumpkinVideo.current
    if (!video) return

    video.muted = true

    try {
      await video.play()
      setPumpkinPlaybackBlocked(false)
      setPumpkinVideoError(null)
    } catch (error) {
      if (video.error) {
        console.error("Pumpkin video failed to load.", video.error)
        setPumpkinVideoError("The pumpkin video could not be loaded.")
        setPumpkinPlaybackBlocked(false)
        return
      }

      console.warn("Pumpkin video autoplay was blocked.", error)
      setPumpkinPlaybackBlocked(true)
    }
  }, [])

  useEffect(() => {
    const video = pumpkinVideo.current
    if (!video) return

    const playPumpkin = () => void startPumpkinVideo()
    const resumePumpkin = () => {
      if (!document.hidden) playPumpkin()
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      playPumpkin()
    }

    video.addEventListener("canplay", playPumpkin)
    document.addEventListener("visibilitychange", resumePumpkin)

    return () => {
      video.removeEventListener("canplay", playPumpkin)
      document.removeEventListener("visibilitychange", resumePumpkin)
    }
  }, [startPumpkinVideo])

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)")
    const updatePointerMode = () => setHasFinePointer(finePointer.matches)

    updatePointerMode()
    finePointer.addEventListener("change", updatePointerMode)
    return () => finePointer.removeEventListener("change", updatePointerMode)
  }, [])

  useEffect(() => {
    const motionLayer = pumpkinMotion.current
    if (!motionLayer || shouldReduceMotion || !hasFinePointer) return

    const movePumpkin = (event: PointerEvent) => {
      const rect = motionLayer.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = Math.max(
        -1,
        Math.min(1, (event.clientX - centerX) / (window.innerWidth / 2)),
      )
      const y = Math.max(
        -1,
        Math.min(1, (event.clientY - centerY) / (window.innerHeight / 2)),
      )

      cursorX.set(x * 12)
      cursorY.set(y * 10)
      cursorRotateX.set(y * -2.5)
      cursorRotateY.set(x * 3)
    }

    const resetPumpkin = () => {
      cursorX.set(0)
      cursorY.set(0)
      cursorRotateX.set(0)
      cursorRotateY.set(0)
    }

    const handleWindowExit = (event: MouseEvent) => {
      if (!event.relatedTarget) resetPumpkin()
    }

    window.addEventListener("pointermove", movePumpkin, { passive: true })
    window.addEventListener("mouseout", handleWindowExit)
    window.addEventListener("blur", resetPumpkin)

    return () => {
      window.removeEventListener("pointermove", movePumpkin)
      window.removeEventListener("mouseout", handleWindowExit)
      window.removeEventListener("blur", resetPumpkin)
      resetPumpkin()
    }
  }, [
    cursorRotateX,
    cursorRotateY,
    cursorX,
    cursorY,
    hasFinePointer,
    shouldReduceMotion,
  ])

  const toggleRave = async () => {
    const video = raveVideo.current
    if (!video) return
    if (video.paused) {
      await video.play()
      setIsRavePlaying(true)
    } else {
      video.pause()
      setIsRavePlaying(false)
    }
  }

  const submitRsvp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <motion.main
      animate="visible"
      className="site-shell"
      initial={shouldReduceMotion ? false : "hidden"}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.75, ease: REVEAL_EASE },
        },
      }}
    >
      <div className="ambient-glows" aria-hidden="true" />
      <audio
        loop
        onPause={() => setIsAudioPlaying(false)}
        onPlay={() => setIsAudioPlaying(true)}
        preload="auto"
        ref={backgroundAudio}
      >
        <source src="/audio/hellowin-theme.opus" type="audio/ogg" />
        <source src="/audio/hellowin-theme.mp3" type="audio/mpeg" />
      </audio>
      <motion.button
        aria-label={
          isAudioPlaying
            ? "Turn background sound off"
            : "Turn background sound on"
        }
        aria-pressed={isAudioPlaying}
        className={`sound-toggle ${heroInView ? "is-hero-visible" : ""}`}
        onClick={() => void toggleSiteAudio()}
        type="button"
        whileHover={
          shouldReduceMotion
            ? undefined
            : {
                scale: 1.025,
                boxShadow: "0 0 18px rgba(252, 163, 5, 0.3)",
              }
        }
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          {isAudioPlaying ? (
            <path d="M16 9.2a4 4 0 0 1 0 5.6M18.5 6.7a7.5 7.5 0 0 1 0 10.6" />
          ) : (
            <path d="m16.5 9 5 5m0-5-5 5" />
          )}
        </svg>
        <span>Sound: {isAudioPlaying ? "on" : "off"}</span>
      </motion.button>
      <header className="header">
        <a className="logo" href="#top">
          HALLOWEEN Party
        </a>
        <nav aria-label="Main navigation">
          <a href="#when">When</a>
          <a href="#dress-code">Dress Code</a>
          <a href="#where">Where</a>
        </nav>
        <Button className="button--small">Claim your seat</Button>
      </header>

      <motion.section
        className="hero"
        id="top"
        ref={heroSection}
        variants={heroStagger}
      >
        <motion.div className="hero__video-frame" variants={revealItem}>
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    y: hasFinePointer ? [-4, 5, -4] : [-3, 3, -3],
                    rotate: hasFinePointer
                      ? [-0.6, 0.6, -0.6]
                      : [-0.35, 0.35, -0.35],
                  }
            }
            className="hero__pumpkin-float"
            transition={{
              duration: 5.6,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <motion.div
              className={`hero__pumpkin-motion ${
                pumpkinReady ? "" : "hero__pumpkin-motion--loading"
              }`}
              ref={pumpkinMotion}
              style={{
                x: pumpkinX,
                y: pumpkinY,
                rotateX: pumpkinRotateX,
                rotateY: pumpkinRotateY,
                transformPerspective: 900,
              }}
            >
              <video
                aria-label="Glowing Halloween pumpkin"
                autoPlay
                className="hero__video"
                loop
                muted
                onError={() => {
                  const error = pumpkinVideo.current?.error
                  console.error("Pumpkin video failed to load.", error)
                  setPumpkinVideoError("The pumpkin video could not be loaded.")
                  setPumpkinPlaybackBlocked(false)
                }}
                onPlaying={() => {
                  setPumpkinPlaybackBlocked(false)
                  setPumpkinReady(true)
                }}
                playsInline
                preload="auto"
                ref={pumpkinVideo}
              >
                <source src="/video/pumpkin-loop-alpha.webm" type="video/webm" />
                <source src="/video/pumpkin-loop.mp4" type="video/mp4" />
              </video>
              {pumpkinPlaybackBlocked && !pumpkinVideoError && (
                <motion.button
                  className="hero__video-start"
                  onClick={() => void startPumpkinVideo()}
                  type="button"
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.025,
                          boxShadow: "0 0 18px rgba(252, 163, 5, 0.3)",
                        }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  Play pumpkin
                </motion.button>
              )}
              {pumpkinVideoError && (
                <p className="hero__video-error" role="alert">
                  {pumpkinVideoError}
                </p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.p className="eyebrow hero__eyebrow" variants={revealItem}>
          Julia’s Halloween Birthday
        </motion.p>
        <div className="hero__meta">
          <motion.p className="meta hero__date" variants={revealItem}>
            Oct 31 · 17:00
          </motion.p>
          <motion.p className="meta hero__venue" variants={revealItem}>
            Lesok Café
          </motion.p>
          <motion.p className="meta hero__city" variants={revealItem}>
            Odesa
          </motion.p>
        </div>
        <motion.div className="hero__title" variants={revealItem}>
          <span>A Birthday</span>
          <strong>
            <SplitLetters delay={0.7} text="Gone Dark" />
          </strong>
        </motion.div>
        <Button
          className={`button--hero ${heroInView ? "" : "is-hero-hidden"}`}
        >
          Claim your seat
        </Button>
      </motion.section>

      <section className="magic" id="when">
        <motion.div
          className="magic__photo"
          initial={shouldReduceMotion ? false : { opacity: 0, x: 140 }}
          style={{ rotate: 14.9 }}
          transition={{ duration: 0.9, ease: REVEAL_EASE }}
          viewport={{ amount: 0.25, once: true }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <img
            src={`${A}/e465c.png`}
            alt="Two witches DJing beneath a giant pumpkin"
          />
        </motion.div>
        <div className="when">
          <p className="eyebrow">When</p>
          <motion.h2 {...slideIn("left")}>Oct 31 · 17:00</motion.h2>
        </div>
        <div className="magic__title display-title">
          <motion.span {...slideIn("left")}>One night</motion.span>
          <motion.span {...slideIn("right", 0.12)}>All the magic</motion.span>
        </div>
        <motion.div
          className="rave-player"
          initial={shouldReduceMotion ? false : { opacity: 0, x: -140 }}
          style={{ rotate: -13.65 }}
          transition={{ duration: 0.9, ease: REVEAL_EASE, delay: 0.15 }}
          viewport={{ amount: 0.25, once: true }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <video
            ref={raveVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onEnded={() => setIsRavePlaying(false)}
          >
            <source src="/video/witches-dj.mp4" type="video/mp4" />
          </video>
          <motion.button
            aria-label={
              isRavePlaying ? "Pause witches video" : "Play witches video"
            }
            className={`play ${isRavePlaying ? "is-playing" : ""}`}
            onClick={toggleRave}
            type="button"
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 1.025,
                    boxShadow: "0 0 18px rgba(252, 163, 5, 0.3)",
                  }
            }
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
          >
            <span />
          </motion.button>
        </motion.div>
        <motion.h3 className="after-dark" {...slideIn("right")}>
          After dark
        </motion.h3>
        <div className="seam-fade seam-fade--magic-spider" aria-hidden="true" />
        <div className="decks">
          <p className="eyebrow">Live from the other side</p>
          <motion.h2 {...slideIn("left")}>The witches take the decks</motion.h2>
          <p>Doors open. Bass drops.</p>
        </div>
      </section>

      <section className="spider" id="dress-code">
        <div className="spider__media">
          <img
            src={`${A}/d2eef.png`}
            alt="A giant spider silhouetted by orange light"
          />
          <Fade />
          <Fade direction="bottom" />
        </div>
        <img className="spider__small" src={`${A}/80a84.png`} alt="" />
        <div className="dress-copy">
          <p className="eyebrow">Dress code</p>
          <motion.h2 {...slideIn("left")}>Masks encouraged</motion.h2>
          <motion.h3 {...slideIn("right", 0.12)}>Faces optional</motion.h3>
          <p>
            No prizes.
            <br />
            Just photos.
          </p>
        </div>
      </section>

      <section className="dance">
        <div className="pose">
          <motion.h2 {...slideIn("right")}>Strike a pose</motion.h2>
          <p>Then lose control</p>
        </div>
        <h2 className="dance__title">
          <SplitLetters bounce text="Dance more" />
        </h2>
        <div className="dance__media">
          <img
            src={`${A}/ec6e2.png`}
            alt="Halloween dance party in a blue fog"
          />
          <Fade />
          <Fade direction="bottom" />
        </div>
      </section>

      <section className="countdown" aria-label="Countdown">
        <p className="eyebrow">The witching hour approaches</p>
        <div className="countdown__units">
          {countdown.map(([number, label]) => (
            <div
              className={`countdown__unit ${
                number.length > 2 ? "is-long" : ""
              }`}
              key={label}
            >
              <strong>{number}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="venue" id="where">
        <p className="eyebrow venue__eyebrow">Where</p>
        <motion.h2 {...slideIn("right")}>Find the coven</motion.h2>
        <div className="venue__info">
          <img src={`${A}/bccad.svg`} alt="" />
          <strong>Lesok Café</strong>
        </div>
        <p className="venue__address">1 Zhemchuzhnaya Street</p>
        <div className="venue__map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2752.298566277573!2d30.71014647702537!3d46.38330307164726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c7cb544b5eecd1%3A0x393feb901c6fdfd9!2z0JbQtdC80YfRg9C20L3QsNGPINGD0LsuLCAxLCDQntC00LXRgdGB0LAsINCe0LTQtdGB0YHQutCw0Y8g0L7QsdC70LDRgdGC0YwsINCj0LrRgNCw0LjQvdCwLCA2NTAwMA!5e0!3m2!1sru!2sus!4v1793701052800!5m2!1sru!2sus"
            title="Lesok Café on Google Maps"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <a
            className="venue__map-link"
            href="https://maps.google.com/?q=1+Zhemchuzhnaya+Street+Odesa"
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        </div>
      </section>

      <section className="rsvp" id="rsvp">
        <Fade />
        <Fade direction="bottom" />
        <div className="rsvp__inner">
          <motion.h2 {...slideIn("left")}>Claim your seat</motion.h2>
          <div className="rsvp__badge">
            <svg
              className="rsvp__badge-ring"
              viewBox="0 0 346 346"
              aria-hidden="true"
            >
              <defs>
                <path
                  id="badgeRing"
                  d="M173,173 m-146,0 a146,146 0 1,1 292,0 a146,146 0 1,1 -292,0"
                />
              </defs>
              <text>
                <textPath
                  href="#badgeRing"
                  textLength="917"
                  lengthAdjust="spacing"
                >
                  Halloween Birthday Party*Halloween Birthday Party*
                </textPath>
              </text>
            </svg>
            <img
              className="rsvp__badge-pumpkin"
              src={`${A}/e4bb5.png`}
              alt=""
            />
          </div>
          <p className="rsvp__lead">
            Come for the birthday. Stay for the dark magic.
          </p>
          <form onSubmit={submitRsvp}>
            {submitted ? (
              <div className="rsvp-success" role="status" aria-live="polite">
                <strong>Your seat is claimed</strong>
                <p>See you on the other side.</p>
                <motion.button
                  className="rsvp-success__edit"
                  onClick={() => setSubmitted(false)}
                  type="button"
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.025,
                          textShadow: "0 0 12px rgba(252, 163, 5, 0.5)",
                        }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  Edit RSVP
                </motion.button>
              </div>
            ) : (
              <>
                <label>
                  Your name
                  <input name="name" placeholder="Enter your name" required />
                </label>
                <label className="select-field">
                  Bringing anyone?
                  <select defaultValue="just-me" name="party">
                    <option value="just-me">Just me</option>
                    <option value="plus-one">Me + 1</option>
                    <option value="plus-two">Me + 2</option>
                  </select>
                </label>
                <motion.button
                  className="button button--form"
                  type="submit"
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.025,
                          boxShadow: "0 0 18px rgba(252, 163, 5, 0.3)",
                        }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  Claim your seat
                </motion.button>
              </>
            )}
          </form>
        </div>
      </section>

      <div className="marquee" aria-label="Event highlights">
        <div className="marquee__track">
          <span className="marquee__unit">{MARQUEE_UNIT}</span>
          <span className="marquee__unit" aria-hidden="true">
            {MARQUEE_UNIT}
          </span>
        </div>
      </div>
      <footer>
        <span className="footer__group">Halloween · Julia</span>{" "}
        <span className="footer__group">October 31 · 17:00</span>
      </footer>
    </motion.main>
  )
}
