"use client"
import React, { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { X, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SOSAlert {
  id: string
  title: string
  message: string
  link: string | null
  created_at: string
}

export default function SOSAlertBanner() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  // Stable client reference — singleton from module
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let userId: string | null = null

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id
      const { data } = await supabase
        .from("notifications")
        .select("id,title,message,link,created_at")
        .eq("user_id", user.id)
        .eq("type", "sos")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(3)
      if (data && data.length > 0) {
        setAlerts(data)
        if ("vibrate" in navigator) navigator.vibrate([400, 150, 400, 150, 400])
        try {
          const ctx = new (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)()
          const playBeep = (freq: number, start: number) => {
            const o = ctx.createOscillator()
            const g = ctx.createGain()
            o.connect(g); g.connect(ctx.destination)
            o.frequency.value = freq; o.type = "square"
            g.gain.setValueAtTime(0.25, ctx.currentTime + start)
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.25)
            o.start(ctx.currentTime + start)
            o.stop(ctx.currentTime + start + 0.3)
          }
          playBeep(1047, 0); playBeep(1047, 0.35); playBeep(1047, 0.7)
        } catch { /* ignore */ }
      }
    }
    load()

    // Real-time subscription — reuse cached userId instead of re-fetching auth
    const channel = supabase
      .channel("sos_alerts")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "type=eq.sos",
      }, (payload: { new: Record<string, string> }) => {
        // Use cached userId — no extra auth.getUser() call per event
        if (userId && payload.new.user_id === userId) {
          const newAlert = payload.new as unknown as SOSAlert
          setAlerts((prev) => [newAlert, ...prev].slice(0, 3))
          if ("vibrate" in navigator) navigator.vibrate([400, 150, 400, 150, 400])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  const dismiss = async (id: string) => {
    setDismissed((prev) => new Set([...prev, id]))
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const visible = alerts.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none">
      <AnimatePresence>
        {visible.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300, delay: i * 0.1 }}
            className="pointer-events-auto"
          >
            <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-b-2 border-red-400 shadow-2xl shadow-red-900/50 px-4 py-3">
              <div className="max-w-4xl mx-auto flex items-start gap-3">
                {/* Pulsing icon */}
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <span className="text-lg">🆘</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm leading-tight">{alert.title}</p>
                  <p className="text-red-100 text-xs mt-0.5 line-clamp-2 leading-relaxed">
                    {alert.message.split("\n").slice(0, 3).join(" · ")}
                  </p>
                  {alert.link && alert.link.includes("maps.google") && (
                    <a href={alert.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-white font-semibold underline hover:no-underline">
                      <MapPin className="w-3 h-3" /> View Location on Map
                    </a>
                  )}
                </div>
                <button onClick={() => dismiss(alert.id)} className="p-1 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
