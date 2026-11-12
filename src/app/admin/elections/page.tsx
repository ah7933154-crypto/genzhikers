"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Plus, Vote, Users, Trophy, CheckCircle2, Loader2, Pencil, X, Save, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface Election {
  id: string
  title: string
  description: string | null
  nomination_start: string
  nomination_end: string
  voting_start: string
  voting_end: string
  results_announce_at: string | null
  results_published_at: string | null
  status: string
  created_at: string
  allow_all_members: boolean
  min_hikes_to_vote: number
}

const ALL_POSITIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Director of Operations",
  "Director of Media & Communications",
  "Director of Community Engagement",
  "Director of Finance & Partnerships",
  "Director of Technology & Development",
]

const statusColors: Record<string, "default"|"secondary"|"success"|"warning"|"destructive"|"info"> = {
  draft: "secondary",
  nominations_open: "info",
  nominations_closed: "warning",
  voting_open: "success",
  closed: "secondary",
  results_published: "default",
}

// Determine the current auto status based on timestamps
function computeAutoStatus(election: Election): string {
  const now = new Date()
  const nomStart = new Date(election.nomination_start)
  const nomEnd   = new Date(election.nomination_end)
  const voteStart = new Date(election.voting_start)
  const voteEnd   = new Date(election.voting_end)

  if (election.status === "results_published") return "results_published"
  if (election.status === "draft") return "draft"
  if (now < nomStart) return "draft"
  if (now >= nomStart && now < nomEnd) return "nominations_open"
  if (now >= nomEnd && now < voteStart) return "nominations_closed"
  if (now >= voteStart && now < voteEnd) return "voting_open"
  if (now >= voteEnd) return "closed"
  return election.status
}

export default function AdminElectionsPage() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [editingHikes, setEditingHikes] = useState<Record<string, string>>({})
  const [selectedPositions, setSelectedPositions] = useState<string[]>(ALL_POSITIONS)
  const [form, setForm] = useState({
    title: "",
    description: "",
    nomination_start: "",
    nomination_end: "",
    voting_start: "",
    voting_end: "",
    results_announce_at: "",
    allow_all_members: true,
    min_hikes_to_vote: 0,
    status: "nominations_open",
  })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from("elections")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) toast.error("Could not load elections: " + error.message)
    setElections(data || [])
    setLoading(false)
    // Auto-sync statuses based on time
    if (data) {
      for (const el of data) {
        const expected = computeAutoStatus(el)
        if (expected !== el.status && expected !== "draft" && el.status !== "results_published") {
          await supabase.from("elections").update({ status: expected }).eq("id", el.id)
        }
      }
    }
  }

  useEffect(() => {
    load()
    // Re-check every 60 seconds to auto-update statuses
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const togglePosition = (pos: string) =>
    setSelectedPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    )

  const handleCreate = async () => {
    if (!form.title || !form.voting_start || !form.voting_end || !form.nomination_start || !form.nomination_end) {
      toast.error("All date fields are required"); return
    }
    if (selectedPositions.length === 0) { toast.error("Select at least one position"); return }
    setSaving(true)

    const res = await fetch("/api/admin/elections/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        results_announce_at: form.results_announce_at || null,
        min_hikes_to_vote: form.allow_all_members ? 0 : form.min_hikes_to_vote,
        positions: selectedPositions,
      }),
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok) { toast.error(result.error || "Failed to create election"); return }
    if (result.warning) toast(result.warning, { icon: "⚠️" })
    else toast.success(`Election created with ${selectedPositions.length} positions!`)

    setShowForm(false)
    setSelectedPositions(ALL_POSITIONS)
    setForm({ title: "", description: "", nomination_start: "", nomination_end: "", voting_start: "", voting_end: "", results_announce_at: "", allow_all_members: true, min_hikes_to_vote: 0, status: "nominations_open" })
    load()
  }

  const publishResults = async (electionId: string) => {
    if (!confirm("Tally votes and assign executive designations to winners?")) return
    setPublishingId(electionId)
    const res = await fetch("/api/admin/elections/publish-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ election_id: electionId }),
    })
    const result = await res.json()
    setPublishingId(null)
    if (!res.ok) { toast.error(result.error || "Failed"); return }
    toast.success(`Results published! ${result.winners?.length || 0} designations assigned. 🎉`)
    load()
  }

  const saveMinHikes = async (id: string) => {
    const val = parseInt(editingHikes[id] ?? "0") || 0
    const { error } = await supabase.from("elections").update({ min_hikes_to_vote: val, allow_all_members: val === 0 }).eq("id", id)
    if (error) toast.error("Update failed")
    else { toast.success("Updated"); setEditingHikes((p) => { const n = { ...p }; delete n[id]; return n }); load() }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Elections</h1>
          <p className="text-sm text-gray-500">Statuses update automatically based on schedule. Press "Publish Results" when voting ends.</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> New Election
        </Button>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h2 className="font-display font-semibold text-[#171B19] text-lg">Create New Election</h2>
          <Input label="Election Title *" value={form.title} onChange={set("title")} placeholder="GenZ Hikers Executive Council 2025" />
          <Textarea label="Description (optional)" value={form.description} onChange={set("description")} rows={2} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input label="Nominations Open *" type="datetime-local" value={form.nomination_start} onChange={set("nomination_start")} />
              <p className="text-xs text-gray-400 mt-1">Status auto-switches to "nominations open" at this time</p>
            </div>
            <div>
              <Input label="Nominations Close *" type="datetime-local" value={form.nomination_end} onChange={set("nomination_end")} />
              <p className="text-xs text-gray-400 mt-1">Status auto-switches to "nominations closed"</p>
            </div>
            <div>
              <Input label="Voting Opens *" type="datetime-local" value={form.voting_start} onChange={set("voting_start")} />
              <p className="text-xs text-gray-400 mt-1">Status auto-switches to "voting open"</p>
            </div>
            <div>
              <Input label="Voting Closes *" type="datetime-local" value={form.voting_end} onChange={set("voting_end")} />
              <p className="text-xs text-gray-400 mt-1">Status auto-switches to "closed" — then you publish results</p>
            </div>
          </div>

          {/* Voter eligibility */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-[#171B19]">Voter Eligibility</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.allow_all_members} onChange={(e) => setForm((f) => ({ ...f, allow_all_members: e.target.checked }))} className="rounded" />
              <span className="text-sm text-[#171B19]">All registered members can vote (0 hikes required)</span>
            </label>
            {!form.allow_all_members && (
              <Input label="Minimum hikes required to vote" type="number" min="0" value={String(form.min_hikes_to_vote)} onChange={(e) => setForm((f) => ({ ...f, min_hikes_to_vote: parseInt(e.target.value) || 0 }))} />
            )}
          </div>

          {/* Positions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#171B19]">Positions <span className="text-xs text-gray-400 font-normal">({selectedPositions.length} selected)</span></p>
              <div className="flex gap-2">
                <button onClick={() => setSelectedPositions(ALL_POSITIONS)} className="text-xs text-[#173D35] hover:underline">All</button>
                <span className="text-gray-300">|</span>
                <button onClick={() => setSelectedPositions([])} className="text-xs text-red-500 hover:underline">None</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_POSITIONS.map((pos) => (
                <label key={pos} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPositions.includes(pos) ? "border-[#173D35] bg-[#173D35]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="checkbox" checked={selectedPositions.includes(pos)} onChange={() => togglePosition(pos)} className="rounded accent-[#173D35]" />
                  <span className="text-sm font-medium text-[#171B19]">{pos}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : `Create Election`}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* ── Elections List ── */}
      <div className="space-y-4">
        {loading ? (
          [...Array(2)].map((_, i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse border border-gray-200" />)
        ) : elections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Vote className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No elections yet. Create one to get started.</p>
          </div>
        ) : elections.map((election) => {
          const autoStatus = computeAutoStatus(election)
          const isEditing = editingHikes[election.id] !== undefined
          return (
            <div key={election.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant={statusColors[election.status] || "secondary"} className="capitalize text-xs">
                      {election.status.replace(/_/g, " ")}
                    </Badge>
                    {autoStatus !== election.status && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        ⏱ Should be: {autoStatus.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-[#171B19] text-lg">{election.title}</h3>
                  {election.description && <p className="text-sm text-gray-500 mt-0.5">{election.description}</p>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Nominations: {formatDate(election.nomination_start)} → {formatDate(election.nomination_end)}</span>
                    <span className="flex items-center gap-1.5"><Vote className="w-3 h-3" /> Voting: {formatDate(election.voting_start)} → {formatDate(election.voting_end)}</span>
                    {election.results_published_at && (
                      <span className="flex items-center gap-1.5 text-green-600"><Trophy className="w-3 h-3" /> Published: {formatDate(election.results_published_at)}</span>
                    )}
                  </div>

                  {/* Min hikes editor */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs text-gray-500">Min hikes to vote:</span>
                    {isEditing ? (
                      <>
                        <input type="number" min="0" value={editingHikes[election.id]} onChange={(e) => setEditingHikes((p) => ({ ...p, [election.id]: e.target.value }))} className="w-16 text-xs border border-[#173D35] rounded px-2 py-1 focus:outline-none" />
                        <button onClick={() => saveMinHikes(election.id)} className="p-1 text-green-600 hover:text-green-700"><Save className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingHikes((p) => { const n = { ...p }; delete n[election.id]; return n })} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-[#173D35]">{election.min_hikes_to_vote}</span>
                        <button onClick={() => setEditingHikes((p) => ({ ...p, [election.id]: String(election.min_hikes_to_vote) }))} className="p-1 text-gray-400 hover:text-[#173D35]"><Pencil className="w-3 h-3" /></button>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-[150px]">
                  <Link href={`/admin/elections/${election.id}`} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#173D35]/20 rounded-lg text-xs text-[#173D35] font-medium hover:bg-[#173D35]/5 transition-colors">
                    <Users className="w-3.5 h-3.5" /> Manage Candidates
                  </Link>

                  {/* Publish results — show when voting has ended */}
                  {(election.status === "voting_open" || election.status === "closed") && (
                    <button onClick={() => publishResults(election.id)} disabled={publishingId === election.id} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50">
                      {publishingId === election.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                      {publishingId === election.id ? "Publishing..." : "Publish Results"}
                    </button>
                  )}

                  {election.status === "results_published" && (
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Results Published
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
