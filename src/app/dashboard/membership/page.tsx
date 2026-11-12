"use client"
import React, { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { CreditCard, Download, Clock, CheckCircle, Mountain, Leaf } from "lucide-react"
import toast from "react-hot-toast"
import { formatDate } from "@/lib/utils"
import { LOGO_URL } from "@/lib/media"

interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  membership_id: string | null
  membership_status: string
  membership_card_url: string | null
  card_requested_at: string | null
  card_approved_at: string | null
  completed_hikes_count: number
  role: string
  city: string | null
  executive_designation: string | null
}

// Draw the card entirely on canvas — no html2canvas needed
async function drawMembershipCard(profile: Profile): Promise<string> {
  const W = 900
  const H = 540
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // ── BACKGROUND — mountain photo + dark overlay ──
  try {
    // Use a Cloudinary-hosted mountain image for reliability + no CORS issues
    const bgImg = await loadImage("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&q=80")
    ctx.drawImage(bgImg, 0, 0, W, H)
  } catch {
    // Fallback: dark gradient
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, "#04120e"); bg.addColorStop(0.5, "#173D35"); bg.addColorStop(1, "#081510")
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  }

  // Dark overlay for readability
  const overlay = ctx.createLinearGradient(0, 0, W, H)
  overlay.addColorStop(0,   "rgba(4,18,14,0.78)")
  overlay.addColorStop(0.4, "rgba(10,31,26,0.72)")
  overlay.addColorStop(1,   "rgba(4,18,14,0.88)")
  ctx.fillStyle = overlay
  ctx.fillRect(0, 0, W, H)

  // Extra darkening on left side for text clarity
  const leftDark = ctx.createLinearGradient(0, 0, W * 0.65, 0)
  leftDark.addColorStop(0,   "rgba(4,18,14,0.5)")
  leftDark.addColorStop(1,   "rgba(4,18,14,0)")
  ctx.fillStyle = leftDark; ctx.fillRect(0, 0, W, H)

  // ── Dot matrix pattern (card texture) ──
  ctx.fillStyle = "rgba(164,170,131,0.05)"
  for (let x = 30; x < W; x += 24) {
    for (let y = 20; y < H; y += 24) {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
    }
  }

  // ── HOLOGRAPHIC LEFT STRIP ──
  const holo = ctx.createLinearGradient(0, 0, 0, H)
  holo.addColorStop(0,   "rgba(164,170,131,0.0)")
  holo.addColorStop(0.3, "rgba(200,210,160,0.18)")
  holo.addColorStop(0.6, "rgba(100,200,150,0.12)")
  holo.addColorStop(0.85,"rgba(200,220,180,0.18)")
  holo.addColorStop(1,   "rgba(164,170,131,0.0)")
  ctx.fillStyle = holo; ctx.fillRect(0, 0, 8, H)

  // ── TOP ACCENT BAR ──
  const bar = ctx.createLinearGradient(0, 0, W, 0)
  bar.addColorStop(0, "#A4AA83"); bar.addColorStop(0.4, "#c8d090"); bar.addColorStop(1, "#8a9068")
  ctx.fillStyle = bar; ctx.fillRect(0, 0, W, 6)
  ctx.fillStyle = "rgba(164,170,131,0.3)"; ctx.fillRect(0, 6, W, 1.5)

  // ── CARD BORDERS ──
  ctx.strokeStyle = "rgba(164,170,131,0.25)"; ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)
  ctx.strokeStyle = "rgba(164,170,131,0.08)"; ctx.lineWidth = 1
  ctx.strokeRect(10, 10, W - 20, H - 20)

  // ── LOGO ──
  try {
    const logoImg = await loadImage(LOGO_URL)
    ctx.save()
    ctx.shadowColor = "rgba(164,170,131,0.4)"; ctx.shadowBlur = 20
    ctx.beginPath(); ctx.arc(76, 68, 42, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
    ctx.drawImage(logoImg, 34, 26, 84, 84)
    ctx.restore()
    ctx.strokeStyle = "rgba(164,170,131,0.55)"; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(76, 68, 44, 0, Math.PI * 2); ctx.stroke()
  } catch {
    ctx.fillStyle = "#A4AA83"
    ctx.beginPath(); ctx.arc(76, 68, 42, 0, Math.PI * 2); ctx.fill()
  }

  // Community name
  ctx.fillStyle = "#A4AA83"; ctx.font = "bold 15px sans-serif"; ctx.letterSpacing = "3px"
  ctx.fillText("GENZ HIKERS", 138, 54)
  ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = "11px sans-serif"; ctx.letterSpacing = "2.5px"
  ctx.fillText("CLEAN  &  GREEN", 139, 76)
  ctx.fillStyle = "rgba(164,170,131,0.35)"; ctx.font = "9px sans-serif"; ctx.letterSpacing = "1px"
  ctx.fillText("PAKISTAN'S YOUTH HIKING COMMUNITY", 139, 95)

  ctx.strokeStyle = "rgba(164,170,131,0.15)"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(32, 118); ctx.lineTo(W - 32, 118); ctx.stroke()

  // ── MEMBER PHOTO ──
  const photoX = 90, photoY = 300, photoR = 76
  ctx.save()
  ctx.shadowColor = "rgba(164,170,131,0.3)"; ctx.shadowBlur = 15
  ctx.strokeStyle = "rgba(164,170,131,0.65)"; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(photoX, photoY, photoR + 4, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()
  ctx.strokeStyle = "rgba(200,210,160,0.4)"; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(photoX, photoY, photoR + 8, 0, Math.PI * 2); ctx.stroke()

  if (profile.avatar_url) {
    try {
      const avatarImg = await loadImage(profile.avatar_url)
      ctx.save()
      ctx.beginPath(); ctx.arc(photoX, photoY, photoR, 0, Math.PI * 2); ctx.closePath(); ctx.clip()
      ctx.drawImage(avatarImg, photoX - photoR, photoY - photoR, photoR * 2, photoR * 2)
      ctx.restore()
    } catch { drawAvatarFallback(ctx, photoX, photoY, photoR, profile.full_name) }
  } else {
    drawAvatarFallback(ctx, photoX, photoY, photoR, profile.full_name)
  }

  // ── MEMBER INFO ──
  const tx = 210
  ctx.save()
  ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 10
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 34px sans-serif"; ctx.letterSpacing = "0px"
  ctx.fillText(profile.full_name || "Member", tx, 170)
  ctx.restore()

  const designation = profile.executive_designation ||
    (profile.role === "super_admin" ? "Head / Founder" :
     profile.role === "senior_member" ? "Senior Member" :
     profile.role === "executive" ? "Executive Member" :
     profile.role === "admin" ? "Administrator" : "Community Member")

  const desigWidth = Math.min(ctx.measureText(designation).width + 28, 300)
  ctx.fillStyle = "rgba(164,170,131,0.22)"
  roundRect(ctx, tx - 2, 182, desigWidth, 28, 14); ctx.fill()
  ctx.strokeStyle = "rgba(164,170,131,0.4)"; ctx.lineWidth = 1
  roundRect(ctx, tx - 2, 182, desigWidth, 28, 14); ctx.stroke()
  ctx.fillStyle = "#c8d090"; ctx.font = "bold 12px sans-serif"; ctx.letterSpacing = "0.5px"
  ctx.fillText(designation, tx + 11, 201)

  if (profile.city) {
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "13px sans-serif"; ctx.letterSpacing = "0px"
    ctx.fillText("📍 " + profile.city, tx, 234)
  }

  const badgeY = profile.city ? 248 : 232
  ctx.fillStyle = "rgba(164,170,131,0.15)"
  roundRect(ctx, tx, badgeY, 165, 38, 10); ctx.fill()
  ctx.strokeStyle = "rgba(164,170,131,0.3)"; ctx.lineWidth = 1
  roundRect(ctx, tx, badgeY, 165, 38, 10); ctx.stroke()
  ctx.fillStyle = "#A4AA83"; ctx.font = "bold 14px sans-serif"
  ctx.fillText(`🏔  ${profile.completed_hikes_count} Hikes Completed`, tx + 12, badgeY + 24)

  // ── MEMBERSHIP ID BOX ──
  const idX = W - 285, idY = 155, idW = 250, idH = 110
  ctx.fillStyle = "rgba(0,0,0,0.35)"
  roundRect(ctx, idX, idY, idW, idH, 14); ctx.fill()
  ctx.strokeStyle = "rgba(164,170,131,0.25)"; ctx.lineWidth = 1
  roundRect(ctx, idX, idY, idW, idH, 14); ctx.stroke()

  ctx.fillStyle = "rgba(164,170,131,0.65)"; ctx.font = "10px sans-serif"; ctx.letterSpacing = "2.5px"
  ctx.fillText("MEMBER  ID", idX + 16, idY + 22)
  ctx.fillStyle = "#c8d090"; ctx.font = "bold 24px monospace"; ctx.letterSpacing = "2px"
  ctx.fillText(profile.membership_id || "GZH-000000", idX + 16, idY + 56)
  ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "10px sans-serif"; ctx.letterSpacing = "1.5px"
  ctx.fillText("STATUS: ACTIVE  ✓", idX + 16, idY + 78)
  ctx.fillStyle = "rgba(164,170,131,0.3)"; ctx.font = "9px sans-serif"; ctx.letterSpacing = "1px"
  ctx.fillText("ISSUED BY GENZ HIKERS", idX + 16, idY + 98)

  // ── DECORATIVE ARC ──
  ctx.save(); ctx.globalAlpha = 0.07
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = "#A4AA83"; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(W - 50, H + 30, 60 + i * 30, Math.PI, Math.PI * 1.5); ctx.stroke()
  }
  ctx.restore()

  // ── FOOTER ──
  const ftGrad = ctx.createLinearGradient(0, H - 55, 0, H)
  ftGrad.addColorStop(0, "rgba(0,0,0,0)"); ftGrad.addColorStop(1, "rgba(0,0,0,0.5)")
  ctx.fillStyle = ftGrad; ctx.fillRect(0, H - 55, W, 55)
  ctx.strokeStyle = "rgba(164,170,131,0.12)"; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(32, H - 50); ctx.lineTo(W - 32, H - 50); ctx.stroke()
  ctx.fillStyle = "rgba(164,170,131,0.55)"; ctx.font = "10px sans-serif"; ctx.letterSpacing = "0.5px"
  ctx.fillText("instagram.com/genz_hikers", 40, H - 22)
  ctx.fillStyle = "rgba(255,255,255,0.2)"
  ctx.fillText("Pakistan's Youth Outdoor Community  🌿", W - 320, H - 22)

  return canvas.toDataURL("image/png", 1.0)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    // Add cache-busting only for Supabase storage URLs to avoid CORS cache issues
    const url = src.includes("supabase") && !src.includes("?")
      ? `${src}?t=${Date.now()}`
      : src

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Second attempt without crossOrigin (some CDNs block the CORS preflight)
      const img2 = new Image()
      img2.onload = () => resolve(img2)
      img2.onerror = reject
      img2.src = url
    }
    img.src = url
  })
}

function drawAvatarFallback(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, name: string) {
  ctx.fillStyle = "#173D35"
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = "#A4AA83"
  ctx.font = `bold ${r}px sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(name?.charAt(0)?.toUpperCase() || "?", x, y)
  ctx.textAlign = "left"
  ctx.textBaseline = "alphabetic"
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function MembershipCardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  // Generate card preview — for approved cards OR for preview (senior+ can see preview)
  useEffect(() => {
    if (profile && (profile.card_approved_at || profile.membership_id)) {
      drawMembershipCard(profile).then(setPreviewUrl).catch(() => {})
    }
  }, [profile?.card_approved_at, profile?.membership_id, profile?.avatar_url, profile?.executive_designation])

  const requestCard = async () => {
    if (!profile) return
    if (profile.membership_status !== "active") {
      toast.error("Your membership must be active to request a card.")
      return
    }
    setRequesting(true)
    const res = await fetch("/api/admin/memberships/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: profile.id, self_request: true }),
    })

    // Fall back to direct Supabase update if API fails
    if (!res.ok) {
      const { error } = await supabase
        .from("profiles")
        .update({ card_requested_at: new Date().toISOString() })
        .eq("id", profile.id)
      setRequesting(false)
      if (error) toast.error("Request failed")
      else {
        setProfile((p) => p ? { ...p, card_requested_at: new Date().toISOString() } : p)
        toast.success("Membership card requested! Admin will review shortly.")
      }
      return
    }

    setRequesting(false)
    setProfile((p) => p ? { ...p, card_requested_at: new Date().toISOString() } : p)
    toast.success("Membership card requested! Admin will review shortly.")
  }

  const downloadCard = async () => {
    if (!profile) return
    setDownloading(true)
    try {
      const dataUrl = await drawMembershipCard(profile)
      const link = document.createElement("a")
      link.download = `GenZHikers-Card-${profile.membership_id || profile.id.slice(0, 8)}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Card downloaded!")
    } catch (e) {
      console.error(e)
      toast.error("Download failed. Please try again.")
    }
    setDownloading(false)
  }

  if (!profile) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-[#173D35]/10" />
      ))}
    </div>
  )

  const hasCard = !!profile.card_approved_at
  const hasRequested = !!profile.card_requested_at && !hasCard
  const isSeniorOrAbove = ["super_admin", "admin", "senior_member", "executive"].includes(profile.role)
  const canRequest = profile.membership_status === "active" && isSeniorOrAbove && !hasRequested && !hasCard

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Membership Card</h1>
        <p className="text-sm text-[#6b6b5e] mt-1">Your official GenZ Hikers digital identity card.</p>
      </div>

      {/* Status banners */}
      {profile.membership_status !== "active" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">Your membership is not yet active.</p>
          <p className="text-xs text-amber-700 mt-1">Once an admin approves your membership, you can request your card.</p>
        </div>
      )}

      {hasRequested && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Card request pending review</p>
            <p className="text-xs text-blue-700 mt-0.5">Requested on {formatDate(profile.card_requested_at!)}</p>
          </div>
        </div>
      )}

      {hasCard && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Membership card approved!</p>
            <p className="text-xs text-green-700 mt-0.5">Approved on {formatDate(profile.card_approved_at!)}</p>
          </div>
        </div>
      )}

      {/* Card Preview + Download */}
      {(hasCard || (isSeniorOrAbove && previewUrl)) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-[#171B19]">{hasCard ? "Your Card" : "Card Preview"}</h2>
            {!hasCard && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">Preview — pending approval</span>}
          </div>

          {/* Canvas-rendered preview with 3D tilt on hover */}
          <div className="max-w-lg mx-auto group perspective-[1200px]">
            <div className="transition-transform duration-300 group-hover:[transform:rotateX(3deg)_rotateY(-3deg)] group-hover:scale-[1.02] relative">
              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#173D35]/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Membership Card"
                    className="w-full"
                  />
                  {/* Shine overlay on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-tr from-transparent via-white/8 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="w-full aspect-[1.65] rounded-2xl bg-gradient-to-br from-[#0a1f1a] via-[#173D35] to-[#0d2e27] flex items-center justify-center shadow-2xl">
                  <div className="text-white/40 text-sm flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                    Generating card…
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={downloadCard}
              disabled={downloading}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Downloading..." : "Download PNG"}
            </Button>
          </div>
        </div>
      )}

      {/* Not eligible */}
      {profile.membership_status === "active" && !isSeniorOrAbove && !hasCard && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-amber-500" />
          </div>
          <p className="font-semibold text-amber-800 text-sm">Membership card is for Senior Members only</p>
          <p className="text-xs text-amber-700 mt-1.5 max-w-sm mx-auto">
            Cards are issued to senior members, executives, and founders.
            Participate in hikes to earn senior member status.
          </p>
        </div>
      )}

      {/* Request CTA */}
      {canRequest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#173D35]/10 p-6 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#173D35]/8 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-[#173D35]" />
          </div>
          <h3 className="font-display font-semibold text-[#171B19] text-lg mb-2">
            Request Your Membership Card
          </h3>
          <p className="text-sm text-[#6b6b5e] mb-6 max-w-sm mx-auto">
            Get your official GenZ Hikers membership card containing your name, photo,
            unique member ID, and community branding.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-6">
            {[
              { icon: Mountain, label: `${profile.completed_hikes_count} Hikes` },
              { icon: CreditCard, label: "Unique ID" },
              { icon: Leaf, label: "Official" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-lg bg-[#173D35]/8 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#173D35]" />
                </div>
                <span className="text-xs text-[#6b6b5e]">{label}</span>
              </div>
            ))}
          </div>
          <Button onClick={requestCard} disabled={requesting}>
            <CreditCard className="w-4 h-4" />
            {requesting ? "Requesting..." : "Request Card"}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
