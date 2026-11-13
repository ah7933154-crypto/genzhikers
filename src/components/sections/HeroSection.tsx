"use client"
import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown, Mountain, Users, MapPin, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { HERO_VIDEO_URL, LOGO_URL } from "@/lib/media"

// Real SVG social icons
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

interface Stats {
  members: number
  hikes: number
  destinations: number
  cleanups: number
}

export default function HeroSection() {
  const { scrollY } = useScroll()
  // Use CSS will-change hint via transform — MotionValues are GPU-composited
  const textY = useTransform(scrollY, [0, 600], [0, 80])
  const textOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const [stats, setStats] = useState<Stats>({ members: 0, hikes: 0, destinations: 0, cleanups: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)

  // Force-start video as early as possible — properly clean up listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onReady = () => { setVideoLoaded(true); video.play().catch(() => {}) }
    const tryPlay = () => { video.play().catch(() => {}) }

    video.addEventListener("loadeddata", onReady)
    video.addEventListener("canplay", onReady)
    tryPlay()

    // Retry on user interaction if autoplay blocked
    const resume = () => { video.play().catch(() => {}) }
    document.addEventListener("click", resume, { once: true })

    return () => {
      video.removeEventListener("loadeddata", onReady)
      video.removeEventListener("canplay", onReady)
      document.removeEventListener("click", resume)
    }
  }, [])

  useEffect(() => {
    async function loadStats() {
      try {
        const supabase = createClient()
        // Run only 2 queries: profiles count + hike_events count (destinations query removed — not critical)
        const [membersRes, hikesRes] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("membership_status", "active"),
          supabase.from("hike_events").select("*", { count: "exact", head: true }).eq("status", "completed"),
        ])
        if (membersRes.error || hikesRes.error) return
        setStats({ members: membersRes.count || 0, hikes: hikesRes.count || 0, destinations: 0, cleanups: 0 })
      } catch { /* silently ignore */ }
    }
    loadStats()
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0a1f1a]">

      {/* ── Video Background ── */}
      <div className="absolute inset-0 z-0 bg-[#0a1f1a]">
        <video
          ref={videoRef}
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        />
        {/* Fallback gradient always visible until video plays */}
        <div className={`absolute inset-0 bg-gradient-to-b from-[#0a1f1a] via-[#0f2a24] to-[#173D35] transition-opacity duration-700 ${videoLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <svg viewBox="0 0 1440 600" className="absolute bottom-0 w-full opacity-30" preserveAspectRatio="none">
            <polygon points="0,600 200,200 400,400 600,150 800,350 1000,180 1200,300 1440,100 1440,600" fill="#0f2a24" />
            <polygon points="0,600 300,280 500,450 700,220 900,380 1100,240 1300,360 1440,180 1440,600" fill="#173D35" />
          </svg>
        </div>
      </div>

      {/* ── Cinematic gradient overlays ── */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-black/20 to-black/75" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/30 via-transparent to-transparent" />

      {/* ── Animated grain texture ── */}
      <div className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* ── Main Content ── */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-4 sm:px-6 pt-28 pb-20"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl mx-auto">
            <Image src={LOGO_URL} alt="GenZ Hikers" width={80} height={80} className="object-cover w-full h-full" />
          </div>
        </motion.div>

        {/* Tag pill */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A4AA83]/20 border border-[#A4AA83]/40 text-[#A4AA83] text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm"
        >
          <Leaf className="w-3 h-3" />
          Pakistan&apos;s Youth Hiking Community
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-bold text-white leading-[0.92] tracking-tight max-w-4xl mb-6"
          style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}
        >
          Explore.
          <br />
          <span className="text-[#A4AA83]">Connect.</span>
          <br />
          Protect.
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="text-white/75 text-lg sm:text-xl max-w-xl leading-relaxed mb-10 font-light"
        >
          Young Pakistanis exploring mountains, building real friendships,
          and leaving nature cleaner, every Sunday.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Button asChild size="xl" variant="white" className="font-bold shadow-2xl shadow-black/30 rounded-xl">
            <Link href="/#hikes">
              <Mountain className="w-4 h-4" />
              Join Next Hike
            </Link>
          </Button>
          <Button asChild size="xl" className="border border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm rounded-xl transition-all font-semibold">
            <Link href="/#about">
              Explore Community
            </Link>
          </Button>
        </motion.div>

        {/* Social links with real icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-5 mt-10"
        >
          <a
            href="https://www.instagram.com/genz_hikers/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-all group"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-yellow-400 group-hover:via-pink-500 group-hover:to-purple-600 flex items-center justify-center transition-all">
              <InstagramIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">Instagram</span>
          </a>
          <a
            href="https://whatsapp.com/channel/0029VbDl4tzEFeXfMtxJVu08"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-all group"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#25D366] flex items-center justify-center transition-all">
              <WhatsAppIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">WhatsApp</span>
          </a>
          <a
            href="https://ig.me/j/xz3NB6N_9dQB81gG"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-white transition-all group"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-yellow-400 group-hover:via-pink-500 group-hover:to-purple-600 flex items-center justify-center transition-all">
              <InstagramIcon className="w-4 h-4" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">IG Group</span>
          </a>
        </motion.div>
      </motion.div>

      {/* ── Stats Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        className="relative z-10 w-full"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
          <div className="grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-md bg-black/30">
            {[
              { icon: Users, value: stats.members || "—", label: "Members" },
              { icon: Mountain, value: stats.hikes || "—", label: "Hikes Done" },
              { icon: MapPin, value: stats.destinations || "—", label: "Destinations" },
              { icon: Leaf, value: "10+", label: "Clean-up Drives" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center py-5 px-3 border-r border-b border-white/10 last:border-r-0 [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r hover:bg-white/5 transition-colors">
                <stat.icon className="w-4 h-4 text-[#A4AA83] mb-1.5" />
                <div className="font-display font-bold text-2xl text-white tracking-tight">{stat.value}</div>
                <div className="text-[11px] text-white/45 mt-0.5 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-white/40"
      >
        <span className="text-[9px] uppercase tracking-[0.2em]">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  )
}
