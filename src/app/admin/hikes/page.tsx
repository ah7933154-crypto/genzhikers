"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Eye, Users, Mountain, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface HikeEvent {
  id: string
  title: string
  destination: string
  event_date: string
  difficulty: string
  status: string
  registered_count: number
  max_participants: number
  registration_fee: number
  slug: string
}

const statusVariants: Record<string, string> = {
  draft: "secondary",
  upcoming: "success",
  ongoing: "info",
  completed: "default",
  postponed: "warning",
  cancelled: "destructive",
}

export default function AdminHikesPage() {
  const [hikes, setHikes] = useState<HikeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("hike_events")
      .select("id,title,destination,event_date,difficulty,status,registered_count,max_participants,registration_fee,slug")
      .order("event_date", { ascending: false })
    setHikes(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("hike_events").update({ status }).eq("id", id)
    if (error) toast.error("Failed to update")
    else { toast.success("Status updated"); load() }
  }

  const deleteHike = async (id: string) => {
    if (!confirm("Delete this hike? This cannot be undone.")) return
    const { error } = await supabase.from("hike_events").delete().eq("id", id)
    if (error) toast.error("Delete failed")
    else { toast.success("Hike deleted"); load() }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Hike Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all hiking events</p>
        </div>
        <Button asChild>
          <Link href="/admin/hikes/new">
            <Plus className="w-4 h-4" />
            New Hike
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Event</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Difficulty</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Registrations</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : hikes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Mountain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-400">No hike events yet.</p>
                  </td>
                </tr>
              ) : (
                hikes.map((hike) => (
                  <tr key={hike.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#171B19]">{hike.title}</p>
                      <p className="text-xs text-gray-400">{hike.destination}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(hike.event_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={hike.difficulty as "easy"|"moderate"|"difficult"|"extreme"} className="capitalize">
                        {hike.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={hike.status}
                        onChange={(e) => updateStatus(hike.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none"
                      >
                        {["draft","upcoming","ongoing","completed","postponed","cancelled"].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold text-[#173D35]">{hike.registered_count}</span>
                        <span className="text-gray-400">/ {hike.max_participants}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/hikes/${hike.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/hikes/${hike.id}/contacts`} className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-500 transition-colors" title="Emergency Contacts">
                          <Phone className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/hikes/${hike.id}/edit`} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deleteHike(hike.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
