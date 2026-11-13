"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Search, UserCheck, UserX, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { formatDate, ROLES } from "@/lib/utils"
import toast from "react-hot-toast"

interface Member {
  id: string
  full_name: string
  email: string
  city: string | null
  role: string
  membership_status: string
  completed_hikes_count: number
  created_at: string
  is_senior_member: boolean
}

const statusVariants: Record<string, string> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
  rejected: "secondary",
}

export default function AdminUsersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const supabase = createClient()

  async function load() {
    setLoading(true)
    let q = supabase
      .from("profiles")
      .select("id,full_name,email,city,role,membership_status,completed_hikes_count,created_at,is_senior_member")
      .order("created_at", { ascending: false })

    if (statusFilter !== "all") q = q.eq("membership_status", statusFilter)
    if (roleFilter !== "all") q = q.eq("role", roleFilter)

    const { data } = await q
    const filtered = (data as Member[] || []).filter((m) =>
      !search || m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase())
    )
    setMembers(filtered)
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter, roleFilter])
  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const res = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, updates }),
    })
    const result = await res.json()
    if (!res.ok) toast.error("Update failed: " + (result.error || "Unknown error"))
    else { toast.success("Member updated"); load() }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">{members.length} total members</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-10 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#173D35]/20 focus:border-[#173D35]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {Object.entries(ROLES).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hikes</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No members found</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#173D35] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {member.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-[#171B19]">{member.full_name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={member.role}
                        onChange={(e) => updateMember(member.id, { role: e.target.value })}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-[#173D35]"
                      >
                        {Object.entries(ROLES).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={(statusVariants[member.membership_status] || "secondary") as "default"|"secondary"|"success"|"warning"|"destructive"|"info"} className="capitalize">
                        {member.membership_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        defaultValue={member.completed_hikes_count}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val) && val !== member.completed_hikes_count) {
                            updateMember(member.id, { completed_hikes_count: val })
                          }
                        }}
                        className="w-16 text-center font-semibold text-[#173D35] border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#173D35]"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(member.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {member.membership_status !== "active" && (
                          <button
                            onClick={() => updateMember(member.id, { membership_status: "active" })}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                            title="Activate"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {member.membership_status !== "suspended" && (
                          <button
                            onClick={() => updateMember(member.id, { membership_status: "suspended" })}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Suspend"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => updateMember(member.id, { is_senior_member: !member.is_senior_member })}
                          className={`p-1.5 rounded-lg transition-colors ${member.is_senior_member ? "text-[#173D35] bg-[#173D35]/10" : "text-gray-400 hover:bg-gray-100"}`}
                          title={member.is_senior_member ? "Remove senior status" : "Make senior member"}
                        >
                          <Shield className="w-4 h-4" />
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
