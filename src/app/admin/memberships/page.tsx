"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, XCircle, CreditCard, Clock } from "lucide-react"
import { formatDate, generateMembershipId } from "@/lib/utils"
import toast from "react-hot-toast"

interface CardRequest {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  membership_id: string | null
  card_requested_at: string
  card_approved_at: string | null
  membership_status: string
  completed_hikes_count: number
  city: string | null
}

export default function AdminMembershipsPage() {
  const [requests, setRequests] = useState<CardRequest[]>([])
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from("profiles")
      .select("id,full_name,email,avatar_url,membership_id,card_requested_at,card_approved_at,membership_status,completed_hikes_count,city")
      .not("card_requested_at", "is", null)
      .order("card_requested_at", { ascending: false })
    setRequests(data || [])
  }

  useEffect(() => { load() }, [])

  const approveCard = async (member: CardRequest) => {
    const { data: { user } } = await supabase.auth.getUser()
    const membershipId = member.membership_id || generateMembershipId()
    const { error } = await supabase.from("profiles").update({
      card_approved_at: new Date().toISOString(),
      card_approved_by: user?.id,
      membership_id: membershipId,
    }).eq("id", member.id)
    if (error) toast.error("Failed: " + error.message)
    else { toast.success(`Card approved for ${member.full_name}`); load() }
  }

  const rejectCard = async (id: string) => {
    const { error } = await supabase.from("profiles").update({
      card_requested_at: null,
    }).eq("id", id)
    if (error) toast.error("Failed")
    else { toast.success("Request rejected"); load() }
  }

  const pending = requests.filter((r) => !r.card_approved_at)
  const approved = requests.filter((r) => !!r.card_approved_at)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Membership Cards</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and approve membership card requests</p>
      </div>

      {/* Pending */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-display font-semibold text-[#171B19] mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Pending Requests ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-4 p-3 rounded-xl border border-amber-100 bg-amber-50">
                <div className="w-10 h-10 rounded-full bg-[#173D35] flex items-center justify-center text-white font-bold flex-shrink-0">
                  {req.full_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#171B19]">{req.full_name}</p>
                  <p className="text-xs text-gray-500">{req.email} · {req.city || "Unknown city"} · {req.completed_hikes_count} hikes</p>
                  <p className="text-xs text-amber-600 mt-0.5">Requested: {formatDate(req.card_requested_at)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approveCard(req)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => rejectCard(req.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-display font-semibold text-[#171B19] mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-green-600" />
          Approved Cards ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No approved cards yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Member</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Membership ID</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Hikes</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Approved</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((req) => (
                  <tr key={req.id} className="border-b border-gray-50">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-[#171B19]">{req.full_name}</p>
                      <p className="text-xs text-gray-400">{req.email}</p>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[#173D35] font-semibold">{req.membership_id}</td>
                    <td className="px-3 py-2.5 text-[#173D35] font-semibold">{req.completed_hikes_count}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">{formatDate(req.card_approved_at!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
