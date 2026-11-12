"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, ArrowLeft, Clock, Users, Award, Play, StopCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface Position {
  id: string
  title: string
  sort_order: number
}

interface Candidate {
  id: string
  position_id: string
  user_id: string
  manifesto: string | null
  is_approved: boolean
  vote_count: number
  profiles: { full_name: string; avatar_url: string | null; city: string | null } | null
}

interface Election {
  id: string
  title: string
  status: string
  nomination_start: string
  nomination_end: string
  voting_start: string
  voting_end: string
}

export default function ElectionCandidatesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [election, setElection] = useState<Election | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [changingStatus, setChangingStatus] = useState(false)

  // All data fetched via API (service role) — bypasses RLS completely
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/elections/candidates?election_id=${id}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Failed to load"); return }
      setElection(data.election)
      setPositions(data.positions)
      setCandidates(data.candidates)
    } catch {
      toast.error("Network error loading nominations")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { if (id) load() }, [id, load])

  const approveCandidate = async (candId: string) => {
    setActingId(candId)
    const res = await fetch("/api/admin/elections/candidates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candId }),
    })
    const data = await res.json()
    setActingId(null)
    if (!res.ok) toast.error(data.error || "Failed to approve")
    else { toast.success("Candidate approved ✓"); load() }
  }

  const rejectCandidate = async (candId: string, name: string) => {
    if (!confirm(`Remove ${name}'s nomination?`)) return
    setActingId(candId)
    const res = await fetch("/api/admin/elections/candidates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidate_id: candId }),
    })
    const data = await res.json()
    setActingId(null)
    if (!res.ok) toast.error(data.error || "Failed to remove")
    else { toast.success("Nomination removed"); load() }
  }

  const changeStatus = async (newStatus: string, confirmMsg: string) => {
    if (!election) return
    if (!confirm(confirmMsg)) return
    setChangingStatus(true)
    const res = await fetch("/api/admin/elections/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ election_id: election.id, status: newStatus }),
    })
    const data = await res.json()
    setChangingStatus(false)
    if (!res.ok) toast.error(data.error || "Failed")
    else { toast.success(`Phase: ${newStatus.replace(/_/g, " ")}`); load() }
  }

  const pendingCount  = candidates.filter((c) => !c.is_approved).length
  const approvedCount = candidates.filter((c) => c.is_approved).length

  const statusBadge: Record<string, "default"|"secondary"|"success"|"warning"|"info"> = {
    nominations_open:   "info",
    nominations_closed: "warning",
    voting_open:        "success",
    closed:             "secondary",
    results_published:  "default",
  }

  return (
    <div className="max-w-4xl space-y-6">

      {/* Back + title */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/admin/elections")}
          className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Nominations & Candidates</h1>
          {election && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm text-gray-500 truncate">{election.title}</p>
              <Badge variant={statusBadge[election.status] || "secondary"} className="text-xs capitalize">
                {election.status.replace(/_/g, " ")}
              </Badge>
            </div>
          )}
          {election && (
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                Nominations: {formatDate(election.nomination_start)} – {formatDate(election.nomination_end)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Voting: {formatDate(election.voting_start)} – {formatDate(election.voting_end)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Manual Status Controls */}
      {election && election.status !== "results_published" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-[#171B19] mb-1">Manual Phase Control</p>
          <p className="text-xs text-gray-400 mb-3">
            Phases switch automatically by schedule, but you can override them here at any time.
          </p>
          <div className="flex flex-wrap gap-2">
            {election.status !== "nominations_open" && (
              <button
                onClick={() => changeStatus("nominations_open", "Open nominations now?")}
                disabled={changingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {changingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Open Nominations
              </button>
            )}
            {election.status === "nominations_open" && (
              <button
                onClick={() => changeStatus("nominations_closed", "Close nominations? No more self-nominations will be accepted.")}
                disabled={changingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {changingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />}
                Close Nominations
              </button>
            )}
            {(election.status === "nominations_open" || election.status === "nominations_closed") && (
              <button
                onClick={() => changeStatus("voting_open", "Open voting now? All approved candidates will become visible to voters.")}
                disabled={changingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {changingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Open Voting Now
              </button>
            )}
            {election.status === "voting_open" && (
              <button
                onClick={() => changeStatus("closed", "Close voting? No more votes will be accepted.")}
                disabled={changingStatus}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {changingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StopCircle className="w-3.5 h-3.5" />}
                Close Voting
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pending Approval</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Approved</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-[#173D35]">{positions.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Positions</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#F5F4EF] rounded-xl border border-[#173D35]/10 p-4">
        <p className="text-sm font-semibold text-[#171B19] mb-1">How nominations work</p>
        <p className="text-xs text-[#6b6b5e]">
          Senior members nominate themselves on the public election page. Nominations appear below as{" "}
          <span className="font-semibold text-amber-600">Pending</span>. Approve or reject each one.
          Approved candidates appear on the voting ballot once voting opens.
        </p>
      </div>

      {/* Positions with candidates */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : positions.map((pos) => {
        const posCandidates = candidates.filter((c) => c.position_id === pos.id)
        const pending  = posCandidates.filter((c) => !c.is_approved)
        const approved = posCandidates.filter((c) => c.is_approved)

        return (
          <div key={pos.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <div className="w-6 h-6 rounded-full bg-[#173D35] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                {pos.sort_order}
              </div>
              <h3 className="font-display font-semibold text-[#171B19] flex-1">{pos.title}</h3>
              <div className="flex gap-1.5">
                {pending.length > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {pending.length} pending
                  </span>
                )}
                {approved.length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {approved.length} approved
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {posCandidates.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <Users className="w-4 h-4" />
                  No nominations yet.
                </div>
              ) : (
                <>
                  {/* Pending nominations — shown first */}
                  {pending.map((cand) => {
                    const profile = cand.profiles
                    const isActing = actingId === cand.id
                    return (
                      <div key={cand.id} className="flex items-start justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-xs font-bold flex-shrink-0">
                            {profile?.full_name?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#171B19]">{profile?.full_name || "Unknown"}</p>
                            <p className="text-xs text-gray-500">
                              {profile?.city || "—"} · <span className="text-amber-600 font-medium">Pending approval</span>
                            </p>
                            {cand.manifesto && (
                              <p className="text-xs text-gray-600 mt-2 bg-white/80 rounded-lg p-2 border border-amber-100 leading-relaxed italic">
                                "{cand.manifesto}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                          <button
                            onClick={() => approveCandidate(cand.id)}
                            disabled={isActing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => rejectCandidate(cand.id, profile?.full_name || "this candidate")}
                            disabled={isActing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Reject
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Approved candidates */}
                  {approved.map((cand) => {
                    const profile = cand.profiles
                    const isActing = actingId === cand.id
                    return (
                      <div key={cand.id} className="flex items-center justify-between gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-800 text-xs font-bold">
                            {profile?.full_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#171B19]">{profile?.full_name}</p>
                            <p className="text-xs text-gray-500">
                              {profile?.city || "—"} · <span className="text-green-700 font-medium">Approved</span>
                              {cand.vote_count > 0 && ` · ${cand.vote_count} votes`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => rejectCandidate(cand.id, profile?.full_name || "this candidate")}
                          disabled={isActing}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          title="Remove candidate"
                        >
                          {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
