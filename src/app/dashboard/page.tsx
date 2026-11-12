import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mountain, Award, Bell, CreditCard, Calendar, ChevronRight, TrendingUp, Footprints, MapPin, Zap } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { LOGO_URL } from "@/lib/media"

type Registration = {
  id: string
  status: string
  event: { title: string; event_date: string; destination: string; difficulty: string } | null
}
type Achievement = {
  id: string
  awarded_at: string
  achievement: { name: string; description: string; icon: string } | null
}

const statusColors: Record<string, "default"|"secondary"|"success"|"warning"|"destructive"|"info"> = {
  pending:"warning", approved:"success", confirmed:"success",
  waitlisted:"info", cancelled:"destructive", attended:"default",
}

const BADGE_EMOJIS: Record<string, string> = {
  footprints:"👣", compass:"🧭", mountain:"🏔", zap:"⚡", triangle:"⛰",
  binoculars:"🔭", flag:"🚩", shield:"🛡", star:"⭐", award:"🏆", trophy:"🥇",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [profileRes, registrationsRes, notificationsRes, achievementsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("event_registrations")
      .select("id,status,event:hike_events(title,event_date,destination,difficulty)")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("notifications")
      .select("id,title,message,type,is_read,created_at")
      .eq("user_id", user.id).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
    supabase.from("member_achievements")
      .select("id,awarded_at,achievement:achievement_types(name,description,icon)")
      .eq("user_id", user.id).order("awarded_at", { ascending: false }).limit(3),
  ])

  const profile = profileRes.data
  const registrations = (registrationsRes.data || []) as unknown as Registration[]
  const notifications = notificationsRes.data || []
  const achievements = (achievementsRes.data || []) as unknown as Achievement[]
  const hikeCount = profile?.completed_hikes_count || 0
  const unreadCount = notifications.length

  // Next badge threshold
  const THRESHOLDS = [3,5,10,15,20,25,30,40,50,75,100]
  const nextThreshold = THRESHOLDS.find((t) => t > hikeCount) || 100
  const prevThreshold = THRESHOLDS.filter((t) => t <= hikeCount).pop() || 0
  const progress = prevThreshold === nextThreshold ? 100 : Math.round(((hikeCount - prevThreshold) / (nextThreshold - prevThreshold)) * 100)

  return (
    <div className="space-y-6">

      {/* ── Hero greeting ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1f1a] via-[#173D35] to-[#1e5045] p-6 sm:p-8">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <polygon points="0,200 80,80 160,140 240,40 320,100 400,20 400,200" fill="white" />
            <polygon points="0,200 60,120 140,160 220,70 300,120 380,60 400,200" fill="white" opacity="0.5" />
          </svg>
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {profile?.avatar_url ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#A4AA83]/40 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#A4AA83]/20 border-2 border-[#A4AA83]/40 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {profile?.full_name?.charAt(0) || "?"}
                </div>
              )}
              <div>
                <p className="text-[#A4AA83] text-xs font-semibold uppercase tracking-widest">Welcome back</p>
                <h1 className="font-display font-bold text-white text-xl sm:text-2xl leading-tight">
                  {profile?.full_name?.split(" ")[0] || "Hiker"} 👋
                </h1>
              </div>
            </div>
            {profile?.executive_designation && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 rounded-full text-xs font-semibold">
                🏅 {profile.executive_designation}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#A4AA83]/30">
              <Image src={LOGO_URL} alt="GenZ Hikers" width={40} height={40} className="object-cover" />
            </div>
          </div>
        </div>

        {/* Hike progress bar */}
        <div className="relative z-10 mt-5">
          <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
            <span className="flex items-center gap-1"><Footprints className="w-3 h-3" /> {hikeCount} hikes completed</span>
            <span>Next badge at {nextThreshold} hikes</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#A4AA83] to-[#c4ca9f] rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Hikes Done", value: hikeCount, icon: Mountain, color: "text-[#173D35]", bg: "from-[#173D35]/10 to-[#173D35]/5", border: "border-[#173D35]/15" },
          { label: "Badges Earned", value: achievements.length, icon: Award, color: "text-amber-600", bg: "from-amber-50 to-amber-50/50", border: "border-amber-200/60" },
          { label: "Notifications", value: unreadCount, icon: Bell, color: "text-blue-600", bg: "from-blue-50 to-blue-50/50", border: "border-blue-200/60" },
          { label: "Membership", value: profile?.membership_status === "active" ? "Active" : "Pending", icon: CreditCard, color: "text-emerald-600", bg: "from-emerald-50 to-emerald-50/50", border: "border-emerald-200/60" },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-4`}>
            <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center mb-2 shadow-sm`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="font-display font-bold text-xl text-[#171B19]">{s.value}</div>
            <div className="text-xs text-[#9c9c8f] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Membership card CTA */}
      {profile?.membership_status === "active" && !profile?.card_requested_at && profile?.is_senior_member && (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#173D35] to-[#1e5045] rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="absolute right-0 top-0 bottom-0 w-32 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full"><circle cx="80" cy="20" r="60" fill="white"/></svg>
          </div>
          <div className="relative">
            <p className="font-display font-semibold text-white">Get Your Membership Card</p>
            <p className="text-white/60 text-xs mt-1">Your official GenZ Hikers digital ID.</p>
          </div>
          <Link href="/dashboard/membership" className="relative flex-shrink-0 px-4 py-2 bg-white text-[#173D35] rounded-xl text-sm font-bold hover:bg-[#F5F4EF] transition-colors">
            Request Card
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Registrations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#173D35]/8 flex items-center justify-center">
                <Mountain className="w-3.5 h-3.5 text-[#173D35]" />
              </div>
              <h2 className="font-display font-semibold text-[#171B19] text-sm">My Registrations</h2>
            </div>
            <Link href="/dashboard/hikes" className="text-xs text-[#173D35] hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {registrations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-[#173D35]/5 flex items-center justify-center mx-auto mb-3">
                  <Mountain className="w-5 h-5 text-[#A4AA83]/50" />
                </div>
                <p className="text-sm text-[#6b6b5e]">No registrations yet.</p>
                <Link href="/#hikes" className="text-xs text-[#173D35] mt-1.5 hover:underline block">Browse upcoming hikes →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {registrations.map((reg) => (
                  <div key={reg.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 hover:bg-[#173D35]/5 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-[#171B19] truncate">{reg.event?.title || "Hike"}</p>
                      <div className="flex items-center gap-1.5 text-xs text-[#9c9c8f] mt-0.5">
                        <MapPin className="w-3 h-3" /> {reg.event?.destination}
                        <span>·</span>
                        <Calendar className="w-3 h-3" /> {reg.event?.event_date && formatDate(reg.event.event_date)}
                      </div>
                    </div>
                    <Badge variant={statusColors[reg.status] || "secondary"} className="capitalize flex-shrink-0 text-xs">{reg.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Achievements + Notifications */}
        <div className="space-y-5">
          {/* Achievements */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h2 className="font-display font-semibold text-[#171B19] text-sm">Recent Achievements</h2>
              </div>
              <Link href="/dashboard/achievements" className="text-xs text-[#173D35] hover:underline flex items-center gap-1">
                All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4">
              {achievements.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-[#6b6b5e]">Complete {3 - hikeCount > 0 ? `${3 - hikeCount} more hike${3-hikeCount!==1?"s":""}` : "hikes"} to earn your first badge.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {achievements.map((ach) => (
                    <div key={ach.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50/50">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
                        {BADGE_EMOJIS[ach.achievement?.icon || ""] || "🎖"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#171B19]">{ach.achievement?.name}</p>
                        <p className="text-xs text-[#9c9c8f]">{formatDate(ach.awarded_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress to next badge */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-[#6b6b5e] mb-1.5">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Next badge</span>
                  <span className="font-semibold text-[#173D35]">{hikeCount}/{nextThreshold}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#A4AA83] to-[#173D35] rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          {unreadCount > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h2 className="font-display font-semibold text-[#171B19] text-sm">{unreadCount} New</h2>
                </div>
                <Link href="/dashboard/notifications" className="text-xs text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="space-y-1.5">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-[#171B19] leading-relaxed line-clamp-2">{n.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
