"use client"
import React, { useEffect, useState, useCallback } from "react"
import { Search, CheckCircle, UserCheck, Clock, XCircle, Users, Calendar, Loader2, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface Registration {
  id: string
  event_id: string
  user_id: string
  status: string
  payment_status: string
  payment_amount: number | null
  checked_in: boolean
  checked_in_at: string | null
  notes: string | null
  created_at: string
  member: { full_name: string; email: string; phone: string | null; city: string | null } | null
  event: { title: string; event_date: string; status: string } | null
}

interface Event { id: string; title: string; event_date: string }

const STATUS_COLORS: Record<string, "default"|"secondary"|"success"|"warning"|"destructive"|"info"> = {
  pending:    "warning",
  approved:   "info",
  confirmed:  "success",
  waitlisted: "secondary",
  cancelled:  "destructive",
  attended:   "default",
}

const ALL_STATUSES = ["pending","approved","confirmed","waitlisted","cancelled","attended"]

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [events, setEvents]               = useState<Event[]>([])
  const [eventFilter, setEventFilter]     = useState("all")
  const [statusFilter, setStatusFilter]   = useState("all")
  const [search, setSearch]               = useState("")
  const [loading, setLoading]             = useState(true)
  const [actingId, setActingId]           = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (eventFilter !== "all") params.set("event_id", eventFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/admin/registrations?${params}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Failed to load"); return }
      setRegistrations(data.registrations || [])
      setEvents(data.events || [])
    } finally {
      setLoading(false)
    }
  }, [eventFilter, statusFilter])

  useEffect(() => { load() }, [load])

  // Client-side search filter
  const filtered = registrations.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.member?.full_name?.toLowerCase().includes(q) ||
      r.member?.email?.toLowerCase().includes(q) ||
      r.event?.title?.toLowerCase().includes(q)
    )
  })

  const updateStatus = async (id: string, status: string) => {
    setActingId(id)
    const res = await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration_id: id, updates: { status } }),
    })
    const data = await res.json()
    setActingId(null)
    if (!res.ok) toast.error(data.error || "Failed")
    else { toast.success(`Status → ${status}`); load() }
  }

  const markAttended = async (id: string) => {
    setActingId(id)
    const res = await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registration_id: id,
        updates: { checked_in: true, checked_in_at: new Date().toISOString(), status: "attended" },
      }),
    })
    const data = await res.json()
    setActingId(null)
    if (!res.ok) toast.error(data.error || "Failed")
    else { toast.success("Marked as attended ✓"); load() }
  }

  // Summary counts
  const counts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = registrations.filter((r) => r.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Registrations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Approve, confirm or mark attendance for hike registrations</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-[#173D35] hover:underline disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { s: "pending",   label: "Pending",   color: "bg-amber-50 border-amber-200 text-amber-700" },
          { s: "approved",  label: "Approved",  color: "bg-blue-50 border-blue-200 text-blue-700" },
          { s: "confirmed", label: "Confirmed", color: "bg-green-50 border-green-200 text-green-700" },
          { s: "attended",  label: "Attended",  color: "bg-[#173D35]/5 border-[#173D35]/20 text-[#173D35]" },
          { s: "cancelled", label: "Cancelled", color: "bg-red-50 border-red-200 text-red-600" },
        ].map(({ s, label, color }) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${color} ${statusFilter === s ? "ring-2 ring-offset-1 ring-current" : "opacity-80 hover:opacity-100"}`}
          >
            {counts[s] > 0 && <span className="font-bold">{counts[s]}</span>}
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#173D35]/20 min-w-[200px]"
        >
          <option value="all">All Events</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title} — {formatDate(e.event_date)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading registrations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No registrations found</p>
            <p className="text-xs mt-1">Try changing the filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Hike Event</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Payment</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Registered</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg) => {
                  const isActing = actingId === reg.id
                  return (
                    <tr key={reg.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      {/* Member */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#173D35] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {reg.member?.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-[#171B19] leading-tight">{reg.member?.full_name || "Unknown"}</p>
                            <p className="text-xs text-gray-400">{reg.member?.email}</p>
                            {reg.member?.city && <p className="text-xs text-gray-400">{reg.member.city}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="px-4 py-3">
                        <p className="text-[#171B19] font-medium leading-tight">{reg.event?.title || "—"}</p>
                        {reg.event?.event_date && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(reg.event.event_date)}
                          </p>
                        )}
                      </td>

                      {/* Status dropdown */}
                      <td className="px-4 py-3">
                        <div className="relative inline-flex items-center">
                          <select
                            value={reg.status}
                            onChange={(e) => updateStatus(reg.id, e.target.value)}
                            disabled={isActing}
                            className={`appearance-none text-xs border rounded-lg px-2.5 py-1.5 pr-6 bg-white focus:outline-none focus:ring-1 focus:ring-[#173D35] cursor-pointer capitalize disabled:opacity-50 ${
                              reg.status === "pending"    ? "border-amber-300 text-amber-700 bg-amber-50"
                              : reg.status === "approved" || reg.status === "confirmed" ? "border-green-300 text-green-700 bg-green-50"
                              : reg.status === "attended" ? "border-[#173D35]/30 text-[#173D35] bg-[#173D35]/5"
                              : reg.status === "cancelled" ? "border-red-300 text-red-600 bg-red-50"
                              : "border-gray-200"
                            }`}
                          >
                            {ALL_STATUSES.map((s) => <option key={s} value={s} className="bg-white text-gray-800">{s}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_COLORS[reg.payment_status] || "secondary"} className="capitalize text-xs">
                          {reg.payment_status?.replace("_", " ") || "—"}
                        </Badge>
                        {reg.payment_amount && reg.payment_amount > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">PKR {reg.payment_amount}</p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(reg.created_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {isActing ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : (
                            <>
                              {/* Quick approve */}
                              {reg.status === "pending" && (
                                <button
                                  onClick={() => updateStatus(reg.id, "approved")}
                                  className="flex items-center gap-1 px-2.5 py-1 bg-[#173D35] text-white text-xs font-medium rounded-lg hover:bg-[#1e5045] transition-colors"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                              )}
                              {/* Mark attended */}
                              {!reg.checked_in && reg.status !== "cancelled" && (
                                <button
                                  onClick={() => markAttended(reg.id)}
                                  className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                                  title="Mark attended"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                              )}
                              {/* Cancel */}
                              {reg.status !== "cancelled" && reg.status !== "attended" && (
                                <button
                                  onClick={() => updateStatus(reg.id, "cancelled")}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              {reg.checked_in && <CheckCircle className="w-4 h-4 text-green-500" aria-label="Attended" />}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} registration{filtered.length !== 1 ? "s" : ""} shown</p>
    </div>
  )
}
