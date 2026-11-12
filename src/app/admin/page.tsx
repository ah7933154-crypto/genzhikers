import React from "react"
import { createClient } from "@/lib/supabase/server"
import { Users, Mountain, Calendar, CreditCard, MessageSquare, Bell, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: pendingCards },
    { count: upcomingHikes },
    { count: completedHikes },
    { count: pendingFeedback },
    { count: openIncidents },
    { data: recentUsers },
    { data: upcomingEvents },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("membership_status", "active"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).not("card_requested_at", "is", null).is("card_approved_at", null),
    supabase.from("hike_events").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("hike_events").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("feedback").select("*", { count: "exact", head: true }).eq("is_approved", false),
    supabase.from("safety_incidents").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("profiles").select("id,full_name,email,role,membership_status,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("hike_events").select("id,title,destination,event_date,registered_count,max_participants,status").eq("status", "upcoming").order("event_date", { ascending: true }).limit(5),
  ])

  const stats = [
    { label: "Total Members", value: totalMembers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/users" },
    { label: "Active Members", value: activeMembers || 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", href: "/admin/users" },
    { label: "Pending Cards", value: pendingCards || 0, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50", href: "/admin/memberships" },
    { label: "Upcoming Hikes", value: upcomingHikes || 0, icon: Mountain, color: "text-[#173D35]", bg: "bg-[#173D35]/8", href: "/admin/hikes" },
    { label: "Completed Hikes", value: completedHikes || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", href: "/admin/hikes" },
    { label: "Pending Feedback", value: pendingFeedback || 0, icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-50", href: "/admin/feedback" },
    { label: "Open Incidents", value: openIncidents || 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", href: "/admin/incidents" },
    { label: "Notifications", value: "—", icon: Bell, color: "text-gray-600", bg: "bg-gray-50", href: "/admin/announcements" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of GenZ Hikers community.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#173D35]/30 hover:shadow-md transition-all group"
          >
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <div className="font-display font-bold text-xl text-[#171B19]">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Alert banners */}
      {(pendingCards || 0) > 0 && (
        <Link href="/admin/memberships" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              {pendingCards} membership card request{(pendingCards || 0) > 1 ? "s" : ""} awaiting approval
            </p>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[#171B19]">Recent Members</h2>
            <Link href="/admin/users" className="text-xs text-[#173D35] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(recentUsers || []).map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#173D35] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.full_name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#171B19] truncate">{u.full_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(u.created_at)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                  u.membership_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {u.membership_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Hikes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[#171B19]">Upcoming Hikes</h2>
            <Link href="/admin/hikes" className="text-xs text-[#173D35] hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {(upcomingEvents || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming hikes. Create one.</p>
            ) : (
              (upcomingEvents || []).map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#171B19] truncate">{event.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(event.event_date)} · {event.destination}</p>
                  </div>
                  <div className="text-xs text-right flex-shrink-0">
                    <span className="font-semibold text-[#173D35]">{event.registered_count}</span>
                    <span className="text-gray-400">/{event.max_participants}</span>
                  </div>
                </div>
              ))
            )}
            <Link
              href="/admin/hikes/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 border-2 border-dashed border-[#173D35]/20 rounded-lg text-sm text-[#173D35] hover:border-[#173D35]/40 hover:bg-[#173D35]/4 transition-all"
            >
              + Create New Hike
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
