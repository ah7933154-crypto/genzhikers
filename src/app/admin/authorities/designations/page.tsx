"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Award, Save, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

interface Member {
  id: string
  full_name: string
  email: string
  role: string
  executive_designation: string | null
  avatar_url: string | null
  city: string | null
}

const DESIGNATIONS = [
  "President", "Vice President", "General Secretary",
  "Director of Operations", "Director of Media & Communications",
  "Director of Community Engagement", "Director of Finance & Partnerships",
  "Director of Technology & Development",
  "Head / Founder", "Senior Advisor", "Event Organizer",
]

export default function DesignationsPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,email,role,executive_designation,avatar_url,city")
      .in("role", ["super_admin","admin","senior_member","executive"])
      .order("full_name")
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveDesignation = async (memberId: string) => {
    const designation = editing[memberId] ?? ""
    setSaving(memberId)
    const res = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: memberId,
        updates: { executive_designation: designation || null },
      }),
    })
    const data = await res.json()
    setSaving(null)
    if (!res.ok) toast.error(data.error || "Failed")
    else {
      toast.success("Designation updated")
      setEditing((e) => { const n = { ...e }; delete n[memberId]; return n })
      load()
    }
  }

  const filtered = members.filter((m) =>
    !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Assign Designations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manually assign official designations to senior members. These show in the Leadership section.</p>
      </div>

      <div className="relative max-w-sm">
        <input type="text" placeholder="Search member..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-4 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#173D35]/20" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No members found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Current Designation</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Set Designation</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const isEditing = editing[member.id] !== undefined
                const isSaving = saving === member.id
                return (
                  <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#173D35] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {member.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-[#171B19]">{member.full_name}</p>
                          <p className="text-xs text-gray-400">{member.role.replace(/_/g," ")}{member.city ? ` · ${member.city}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {member.executive_designation ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-semibold">
                          <Award className="w-3 h-3" /> {member.executive_designation}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={isEditing ? editing[member.id] : (member.executive_designation || "")}
                        onChange={(e) => setEditing((prev) => ({ ...prev, [member.id]: e.target.value }))}
                        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#173D35] min-w-[220px]"
                      >
                        <option value="">— Remove designation —</option>
                        {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => saveDesignation(member.id)} disabled={isSaving}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#173D35] text-white text-xs font-medium rounded-lg hover:bg-[#1e5045] transition-colors disabled:opacity-50">
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save
                          </button>
                          <button onClick={() => setEditing((e) => { const n={...e}; delete n[member.id]; return n })}
                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setEditing((prev) => ({ ...prev, [member.id]: member.executive_designation || "" }))}
                          className="text-xs text-[#173D35] hover:underline px-2 py-1">
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
