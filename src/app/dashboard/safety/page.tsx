"use client"
import React, { useState, useEffect } from "react"
import { Phone, MapPin, Shield, Info, CheckCircle, Wifi, WifiOff, Navigation, AlertTriangle, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

const EMERGENCY_TYPES = [
  { id: "Medical Emergency",  emoji: "🚑", bg: "bg-red-600",    hover: "hover:bg-red-500"    },
  { id: "Lost",               emoji: "🧭", bg: "bg-orange-500", hover: "hover:bg-orange-400" },
  { id: "Stuck on Trail",     emoji: "⛰️",  bg: "bg-amber-500",  hover: "hover:bg-amber-400"  },
  { id: "Immediate Danger",   emoji: "🆘",  bg: "bg-red-700",   hover: "hover:bg-red-600"    },
]

const EMERGENCY_NUMBERS = [
  { label: "Rescue 1122", number: "1122", emoji: "🚒" },
  { label: "Police",      number: "15",   emoji: "👮" },
  { label: "Edhi",        number: "115",  emoji: "🏥" },
  { label: "NDMA",        number: "1700", emoji: "⚠️" },
]

const SAFETY_TIPS = [
  "Stay calm — assess your situation first",
  "Stay in one place if lost — moving makes rescue harder",
  "Signal with whistle 3 times = emergency",
  "Conserve phone battery to 20%+",
  "Call 1122 (Rescue) if you have signal",
  "Drink water if available",
]

export default function SafetyPage() {
  const router = useRouter()
  const [step, setStep] = useState<"idle"|"confirm"|"sending"|"done">("idle")
  const [selectedType, setSelectedType] = useState("")
  const [location, setLocation] = useState<{lat:number;lng:number}|null>(null)
  const [gettingLoc, setGettingLoc] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [result, setResult] = useState<{whatsappUrl:string; mapsUrl:string|null; memberName:string; alertMessage:string; whatsappGroupUrl:string} | null>(null)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener("online",  on)
    window.addEventListener("offline", off)
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off) }
  }, [])

  // Auto-capture GPS when user picks an emergency type
  const pickType = (type: string) => {
    setSelectedType(type)
    setGettingLoc(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGettingLoc(false) },
        () => setGettingLoc(false),
        { timeout: 6000, enableHighAccuracy: true }
      )
    } else { setGettingLoc(false) }
    setStep("confirm")
  }

  const sendSOS = async () => {
    setStep("sending")

    // Trigger device vibration immediately (works on mobile)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500])
    }

    // Play emergency beep using Web Audio API
    try {
      const ctx = new (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)()
      const playBeep = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = freq
        osc.type = "square"
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      }
      // 3 urgent beeps
      playBeep(880, 0, 0.3); playBeep(880, 0.4, 0.3); playBeep(880, 0.8, 0.3)
    } catch { /* Audio not supported, ignore */ }

    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergency_type: selectedType,
          lat: location?.lat,
          lng: location?.lng,
          description: `SOS: ${selectedType}`,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        // If unauthorized, redirect to login
        if (res.status === 401) { toast.error("Please sign in to send SOS"); router.push("/auth/login"); return }
        throw new Error(data.error || "Failed")
      }

      const data = await res.json()
      setResult(data)
      setStep("done")
      toast.success("🆘 SOS sent to all members!", { duration: 6000 })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send SOS")
      setStep("confirm")
    }
  }

  const reset = () => {
    setStep("idle"); setSelectedType(""); setLocation(null); setResult(null)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Safety & Emergency SOS</h1>
          <p className="text-sm text-[#6b6b5e] mt-1">One tap sends an alert to all GenZ Hikers members.</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          isOnline ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      {/* ── SOS PANEL ── */}
      <div className="relative overflow-hidden rounded-3xl border border-red-800/40">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0505] via-red-950 to-[#0d0202]" />
        {step === "idle" && (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-6 right-6 w-40 h-40 bg-red-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-4 left-8 w-32 h-32 bg-red-700 rounded-full blur-2xl animate-pulse" style={{animationDelay:"0.8s"}} />
          </div>
        )}

        <div className="relative z-10 p-6">
          {/* ── IDLE: pick emergency type ── */}
          {step === "idle" && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-300 text-xs font-semibold uppercase tracking-wider mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Emergency SOS
                </div>
                <h2 className="text-white font-bold text-xl">What is the emergency?</h2>
                <p className="text-red-200/50 text-xs mt-1">Tap to instantly alert all GenZ Hikers members</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EMERGENCY_TYPES.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => pickType(e.id)}
                    className={`${e.bg} ${e.hover} active:scale-95 transition-all duration-100 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg`}
                  >
                    <span className="text-3xl">{e.emoji}</span>
                    <span className="text-white font-semibold text-sm text-center leading-tight">{e.id}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-red-200/30 text-xs">Your location, name & emergency contacts are sent automatically</p>
            </div>
          )}

          {/* ── CONFIRM ── */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-4xl">{EMERGENCY_TYPES.find(e=>e.id===selectedType)?.emoji}</span>
                <h2 className="text-white font-bold text-xl mt-2">{selectedType}</h2>
              </div>
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                location ? "bg-green-900/50 border border-green-700/40 text-green-300"
                : gettingLoc ? "bg-blue-900/50 border border-blue-700/40 text-blue-300"
                : "bg-white/10 border border-white/15 text-white/50"
              }`}>
                <Navigation className="w-4 h-4 flex-shrink-0" />
                {location ? `GPS captured: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : gettingLoc ? "Getting your GPS location…"
                  : "GPS not available — city will be used"}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-red-200/60 leading-relaxed">
                This will instantly notify <strong className="text-white">all GenZ Hikers members</strong> with your name, emergency type, GPS location, and your emergency contact details.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={sendSOS}
                  className="flex-1 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 active:scale-98 text-white font-bold text-lg rounded-2xl shadow-xl shadow-red-900/50 transition-all"
                >
                  🆘 SEND SOS NOW
                </button>
                <button onClick={reset} className="px-4 py-4 bg-white/10 hover:bg-white/15 text-white/60 rounded-2xl transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── SENDING ── */}
          {step === "sending" && (
            <div className="text-center space-y-4 py-6">
              <div className="relative w-20 h-20 mx-auto">
                {[1,2,3].map(i => (
                  <span key={i} className="absolute inset-0 rounded-full border-2 border-red-400/30 animate-ping" style={{animationDelay:`${i*0.3}s`}} />
                ))}
                <div className="relative w-20 h-20 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white font-black text-xl">SOS</span>
                </div>
              </div>
              <p className="text-white font-bold text-lg">Sending emergency alert…</p>
              <p className="text-red-200/50 text-sm">Notifying all members & saving your location</p>
            </div>
          )}

          {/* ── DONE ── */}
          {step === "done" && result && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500 shadow-lg shadow-green-900/50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-white font-bold text-xl">SOS Sent!</h2>
                <p className="text-green-300/70 text-sm mt-1">All GenZ Hikers members have been notified</p>
              </div>

              {/* Alert preview */}
              <div className="bg-white/8 border border-white/15 rounded-2xl p-4 text-xs text-red-100/70 font-mono whitespace-pre-wrap leading-relaxed">
                {result.alertMessage}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 gap-2">
                {/* WhatsApp forward button */}
                <a
                  href={result.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#1fb855] text-white font-bold rounded-2xl transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Forward Alert on WhatsApp
                </a>

                {result.mapsUrl && (
                  <a href={result.mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl transition-colors">
                    <MapPin className="w-4 h-4" /> Share My Location on Map
                  </a>
                )}

                <a href={result.whatsappGroupUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-2xl transition-colors text-sm">
                  <ExternalLink className="w-4 h-4" /> Open GenZ Hikers WhatsApp Channel
                </a>
              </div>

              <button onClick={reset} className="w-full text-center text-red-300/40 hover:text-red-300/70 text-xs py-2 transition-colors">
                Reset SOS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Numbers */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-500" />
          <h2 className="font-display font-semibold text-[#171B19] text-sm">Emergency Numbers</h2>
          <span className="text-xs text-gray-400 ml-auto">Work without internet</span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EMERGENCY_NUMBERS.map((e) => (
            <a key={e.number} href={`tel:${e.number}`}
              className="flex flex-col items-center gap-1.5 p-3 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200/60 transition-colors text-center">
              <span className="text-xl">{e.emoji}</span>
              <span className="font-bold text-red-600 text-xl leading-tight">{e.number}</span>
              <span className="text-xs text-gray-500">{e.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#173D35]" />
          <h2 className="font-display font-semibold text-[#171B19] text-sm">If You Are in Danger</h2>
          <span className="text-xs text-gray-400 ml-auto flex items-center gap-1"><WifiOff className="w-3 h-3" /> offline</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAFETY_TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F5F4EF]">
              <span className="w-5 h-5 rounded-full bg-[#173D35]/12 flex items-center justify-center text-[10px] font-bold text-[#173D35] flex-shrink-0 mt-0.5">{i+1}</span>
              <p className="text-xs text-[#6b6b5e] leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Important:</strong> This SOS tool alerts GenZ Hikers members. It does NOT replace calling emergency services. In a life-threatening emergency, call <strong>1122</strong> first.
        </p>
      </div>
    </div>
  )
}
