import React from "react"
import { createClient } from "@/lib/supabase/server"
import { Award } from "lucide-react"
import { formatDate } from "@/lib/utils"

const BADGE_EMOJIS: Record<string, string> = {
  "footprints": "👣",
  "compass":    "🧭",
  "mountain":   "🏔",
  "zap":        "⚡",
  "triangle":   "⛰",
  "binoculars": "🔭",
  "flag":       "🚩",
  "shield":     "🛡️",
  "star":       "⭐",
  "award":      "🏆",
  "trophy":     "🥇",
}

export default async function AchievementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [achievTypesRes, memberAchRes, profileRes] = await Promise.all([
    supabase.from("achievement_types").select("*").order("sort_order"),
    supabase.from("member_achievements").select("achievement_id,awarded_at").eq("user_id", user.id),
    supabase.from("profiles").select("completed_hikes_count,total_distance_km").eq("id", user.id).single(),
  ])

  const allTypes = achievTypesRes.data || []
  const earned = new Set((memberAchRes.data || []).map((a) => a.achievement_id))
  const earnedMap = Object.fromEntries((memberAchRes.data || []).map((a) => [a.achievement_id, a.awarded_at]))
  const profile = profileRes.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Achievements</h1>
        <p className="text-sm text-[#6b6b5e] mt-1">Badges earned through your hiking journey.</p>
      </div>

      {/* Progress summary */}
      <div className="bg-[#173D35] rounded-xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🏔</div>
          <div>
            <p className="font-display font-bold text-2xl">{profile?.completed_hikes_count || 0}</p>
            <p className="text-white/70 text-sm">Verified hikes completed</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display font-bold text-2xl">{earned.size}</p>
            <p className="text-white/70 text-sm">Badges earned</p>
          </div>
        </div>
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allTypes.map((type) => {
          const isEarned = earned.has(type.id)
          return (
            <div
              key={type.id}
              className={`rounded-xl border p-4 transition-all ${
                isEarned
                  ? "bg-white border-[#A4AA83]/40 shadow-sm"
                  : "bg-[#F5F4EF] border-[#173D35]/5 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isEarned ? "bg-[#A4AA83]/20" : "bg-gray-200"
                }`}>
                  {isEarned ? (BADGE_EMOJIS[type.icon] || "🎖") : "🔒"}
                </div>
                <div className="flex-1">
                  <p className={`font-display font-semibold text-sm ${isEarned ? "text-[#171B19]" : "text-[#9c9c8f]"}`}>
                    {type.name}
                  </p>
                  <p className="text-xs text-[#9c9c8f] mt-0.5">{type.description}</p>
                  {isEarned && earnedMap[type.id] && (
                    <p className="text-xs text-[#A4AA83] mt-1 font-medium">
                      Earned {formatDate(earnedMap[type.id])}
                    </p>
                  )}
                  {!isEarned && (
                    <p className="text-xs text-[#9c9c8f] mt-1">
                      {type.requirement_type === "hike_count"
                        ? `Complete ${type.requirement_value} hikes`
                        : `Cover ${type.requirement_value} km`}
                    </p>
                  )}
                </div>
                {isEarned && (
                  <Award className="w-5 h-5 text-[#A4AA83] flex-shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
