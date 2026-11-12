import React from "react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Mountain, Calendar, MapPin, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function DashboardHikesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("id,status,payment_status,checked_in,created_at,event:hike_events(id,title,slug,destination,event_date,difficulty,status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const completed = (registrations || []).filter((r) => r.status === "attended")
  const upcoming = (registrations || []).filter((r) => r.status !== "attended" && r.status !== "cancelled")

  const statusColors: Record<string, string> = {
    pending: "warning", approved: "success", confirmed: "success",
    waitlisted: "info", cancelled: "destructive", attended: "default",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">My Hikes</h1>
        <p className="text-sm text-[#6b6b5e] mt-1">Your registrations and hiking history.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#173D35]/10 p-4">
          <Mountain className="w-5 h-5 text-[#173D35] mb-2" />
          <p className="font-display font-bold text-xl text-[#171B19]">{completed.length}</p>
          <p className="text-xs text-[#9c9c8f]">Completed Hikes</p>
        </div>
        <div className="bg-white rounded-xl border border-[#173D35]/10 p-4">
          <Calendar className="w-5 h-5 text-[#173D35] mb-2" />
          <p className="font-display font-bold text-xl text-[#171B19]">{upcoming.length}</p>
          <p className="text-xs text-[#9c9c8f]">Upcoming</p>
        </div>
        <div className="bg-white rounded-xl border border-[#173D35]/10 p-4">
          <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
          <p className="font-display font-bold text-xl text-[#171B19]">{(registrations || []).length}</p>
          <p className="text-xs text-[#9c9c8f]">Total Registered</p>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-[#173D35]/10 p-5">
          <h2 className="font-display font-semibold text-[#171B19] mb-4">Upcoming Registrations</h2>
          <div className="space-y-3">
            {upcoming.map((reg) => {
              const event = reg.event as unknown as { slug: string; title: string; destination: string; event_date: string; difficulty: string } | null
              return (
                <div key={reg.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-[#173D35]/5 last:border-0">
                  <div className="min-w-0">
                    <Link href={event ? `/hikes/${event.slug}` : "#"} className="font-medium text-sm text-[#171B19] hover:text-[#173D35] transition-colors">
                      {event?.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-[#9c9c8f] mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {event && formatDate(event.event_date)}
                      <MapPin className="w-3 h-3 ml-1" />
                      {event?.destination}
                    </div>
                  </div>
                  <Badge variant={(statusColors[reg.status] || "secondary") as "default"|"secondary"|"success"|"warning"|"destructive"|"info"} className="capitalize flex-shrink-0 text-xs">
                    {reg.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-[#173D35]/10 p-5">
        <h2 className="font-display font-semibold text-[#171B19] mb-4">Hiking History</h2>
        {completed.length === 0 ? (
          <div className="text-center py-8">
            <Mountain className="w-8 h-8 text-[#A4AA83]/40 mx-auto mb-2" />
            <p className="text-sm text-[#6b6b5e]">No completed hikes yet. Join your first hike!</p>
            <Link href="/#hikes" className="text-xs text-[#173D35] mt-1 hover:underline block">Browse upcoming hikes →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((reg) => {
              const event = reg.event as unknown as { slug: string; title: string; destination: string; event_date: string; difficulty: string } | null
              return (
                <div key={reg.id} className="flex items-center gap-3 py-2 border-b border-[#173D35]/5 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-[#173D35]/8 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-[#173D35]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#171B19] truncate">{event?.title}</p>
                    <div className="flex items-center gap-2 text-xs text-[#9c9c8f] mt-0.5">
                      <span>{event && formatDate(event.event_date)}</span>
                      <span>·</span>
                      <span className="capitalize">{event?.difficulty}</span>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs flex-shrink-0">Completed</Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
