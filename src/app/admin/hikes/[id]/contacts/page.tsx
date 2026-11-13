"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Phone, Users, Download, ExternalLink, Loader2, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

interface Registration {
  id: string
  user_id: string
  status: string
  member: {
    full_name: string
    email: string
    phone: string | null
    city: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
    emergency_contact_relation: string | null
  } | null
}

interface Hike {
  id: string
  title: string
  event_date: string
  destination: string
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1QPqkycAoXqNhmbNSrog4ZlZhEflTNJaoQRjlV4ReX6I/edit?usp=sharing"

export default function HikeContactsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [hike, setHike] = useState<Hike | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch via admin API to bypass RLS
      const res = await fetch(`/api/admin/registrations?event_id=${id}&status=approved`)
      const data = await res.json()

      if (!res.ok) { toast.error("Failed to load"); return }

      // Also get pending + confirmed registrations
      const res2 = await fetch(`/api/admin/registrations?event_id=${id}&status=confirmed`)
      const data2 = await res2.json()
      const res3 = await fetch(`/api/admin/registrations?event_id=${id}&status=attended`)
      const data3 = await res3.json()

      const allRegs = [
        ...(data.registrations || []),
        ...(data2.registrations || []),
        ...(data3.registrations || []),
      ]

      // Enrich with emergency contacts — fetch profiles separately
      if (allRegs.length > 0) {
        const userIds = allRegs.map((r: { user_id: string }) => r.user_id)
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,full_name,email,phone,city,emergency_contact_name,emergency_contact_phone,emergency_contact_relation")
          .in("id", userIds)

        const profileMap = Object.fromEntries((profiles || []).map((p: { id: string; full_name: string; email: string; phone: string | null; city: string | null; emergency_contact_name: string | null; emergency_contact_phone: string | null; emergency_contact_relation: string | null }) => [p.id, p]))
        const enriched = allRegs.map((r: Registration) => ({ ...r, member: profileMap[r.user_id] || null }))
        setRegistrations(enriched)
      }

      // Hike info
      if (data.events?.length > 0) {
        const h = data.events.find((e: Hike) => e.id === id)
        if (h) setHike(h)
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  // Build CSV for download / Google Sheets paste
  const buildCSV = () => {
    const rows = [["Name", "Email", "Phone", "City", "Emergency Contact", "Emrg.Contact1", "Emrg.Contact2 (Relation)"]]
    registrations.forEach((r) => {
      const m = r.member
      rows.push([
        m?.full_name || "",
        m?.email || "",
        m?.phone || "",
        m?.city || "",
        m?.emergency_contact_name || "",
        m?.emergency_contact_phone || "",
        m?.emergency_contact_relation || "",
      ])
    })
    return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g,"''")}"`).join(",")).join("\n")
  }

  const downloadCSV = () => {
    const csv = buildCSV()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url
    a.download = `${hike?.title || "hike"}_emergency_contacts.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("CSV downloaded!")
  }

  const syncToSheet = async () => {
    setSyncing(true)
    // We download the CSV — user then pastes into the sheet
    // (Google Sheets API requires OAuth; direct paste is simplest and reliable)
    downloadCSV()
    setTimeout(() => {
      toast("CSV downloaded. Open the Google Sheet and paste the data.", {
        icon: "📋",
        duration: 6000,
      })
      setSyncing(false)
    }, 500)
  }

  const withContacts = registrations.filter((r) => r.member?.emergency_contact_phone)
  const withoutContacts = registrations.filter((r) => !r.member?.emergency_contact_phone)

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.push("/admin/hikes")} className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Emergency Contacts</h1>
          {hike && <p className="text-sm text-gray-500 mt-0.5">{hike.title} · {hike.destination}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#173D35] text-white text-xs font-medium rounded-lg hover:bg-[#1e5045] transition-colors">
            <Download className="w-3.5 h-3.5" /> Download CSV
          </button>
          <a href={SHEET_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Open Sheet
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#173D35]">{registrations.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Registered</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{withContacts.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Have Emergency Contacts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{withoutContacts.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Missing Contacts</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">How to sync to Google Sheet</p>
          <ol className="text-xs text-blue-700 mt-1.5 space-y-1 list-decimal list-inside">
            <li>Click <strong>Download CSV</strong> above</li>
            <li>Click <strong>Open Sheet</strong> to open the Google Sheet</li>
            <li>In the sheet: File → Import → Upload the downloaded CSV</li>
            <li>Or simply copy-paste: select all CSV rows, paste into cell A1</li>
          </ol>
        </div>
      </div>

      {/* Contacts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <Users className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-[#171B19] text-sm">Registered Members & Emergency Contacts</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No approved registrations for this hike</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Phone</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Emergency Contact</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Emrg. Phone</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Relation</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => {
                  const m = reg.member
                  const hasEmrg = !!m?.emergency_contact_phone
                  return (
                    <tr key={reg.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${!hasEmrg ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#171B19]">{m?.full_name || "—"}</p>
                        <p className="text-xs text-gray-400">{m?.city || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        {m?.phone ? (
                          <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-[#173D35] hover:underline text-xs">
                            <Phone className="w-3 h-3" /> {m.phone}
                          </a>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">{m?.emergency_contact_name || <span className="text-xs text-amber-500">Not set</span>}</td>
                      <td className="px-4 py-3">
                        {m?.emergency_contact_phone ? (
                          <a href={`tel:${m.emergency_contact_phone}`} className="flex items-center gap-1 text-red-600 hover:underline font-semibold text-xs">
                            <Phone className="w-3 h-3" /> {m.emergency_contact_phone}
                          </a>
                        ) : <span className="text-xs text-amber-500">Not set</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{m?.emergency_contact_relation || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
