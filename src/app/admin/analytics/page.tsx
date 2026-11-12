import React from "react"
import { createClient } from "@/lib/supabase/server"
import { Users, Mountain, Calendar, TrendingUp, Award, MessageSquare } from "lucide-react"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: totalHikes },
    { count: completedHikes },
    { count: totalRegistrations },
    { count: totalFeedback },
    { data: hikesByMonth },
    { data: topDestinations },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("membership_status", "active"),
    supabase.from("hike_events").select("*", { count: "exact", head: true }),
    supabase.from("hike_events").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("event_registrations").select("*", { count: "exact", head: true }),
    supabase.from("feedback").select("*", { count: "exact", head: true }),
    supabase.from("hike_events").select("event_date,registered_count,attended_count,destination").eq("status","completed").order("event_date", { ascending: false }).limit(10),
    supabase.from("hike_events").select("destination").eq("status","completed"),
  ])

  const destCounts: Record<string, number> = {}
  topDestinations?.forEach((h) => {
    destCounts[h.destination] = (destCounts[h.destination] || 0) + 1
  })
  const sortedDests = Object.entries(destCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const stats = [
    { label: "Total Members", value: totalMembers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", change: "Registered accounts" },
    { label: "Active Members", value: activeMembers || 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", change: "Approved memberships" },
    { label: "Total Hike Events", value: totalHikes || 0, icon: Mountain, color: "text-[#173D35]", bg: "bg-[#173D35]/8", change: "All time" },
    { label: "Completed Hikes", value: completedHikes || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", change: "Successfully run" },
    { label: "Total Registrations", value: totalRegistrations || 0, icon: Award, color: "text-orange-600", bg: "bg-orange-50", change: "Across all events" },
    { label: "Feedback Received", value: totalFeedback || 0, icon: MessageSquare, color: "text-pink-600", bg: "bg-pink-50", change: "From members" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Analytics</h1>
        <p className="text-sm text-gray-500">Community growth and activity overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="font-display font-bold text-2xl text-[#171B19]">{stat.value}</div>
            <div className="text-sm font-medium text-[#171B19] mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent hikes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-display font-semibold text-[#171B19] mb-4">Recent Completed Hikes</h2>
          {!hikesByMonth || hikesByMonth.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No completed hikes yet</p>
          ) : (
            <div className="space-y-3">
              {hikesByMonth.map((hike, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#171B19] truncate">{hike.destination}</p>
                    <p className="text-xs text-gray-400">{new Date(hike.event_date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#173D35]">{hike.attended_count || hike.registered_count}</p>
                    <p className="text-xs text-gray-400">attended</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top destinations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-display font-semibold text-[#171B19] mb-4">Most Visited Destinations</h2>
          {sortedDests.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {sortedDests.map(([dest, count]) => {
                const maxCount = sortedDests[0][1]
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <div key={dest}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#171B19]">{dest}</span>
                      <span className="text-xs text-gray-500">{count} hike{count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#173D35] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
