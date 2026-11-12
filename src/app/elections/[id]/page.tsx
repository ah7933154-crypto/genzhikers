"use client"
import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Vote, CheckCircle, Lock, User, AlertTriangle, Award,
  ChevronDown, ChevronUp, Trophy, Star, Clock, Loader2
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface Position { id: string; title: string; sort_order: number }
interface Candidate {
  id: string; position_id: string; user_id: string
  manifesto: string | null; vote_count: number; is_approved: boolean
  profile: { full_name: string; avatar_url: string | null; city: string | null } | null
}
interface Election {
  id: string; title: string; description: string | null
  nomination_start: string; nomination_end: string
  voting_start: string; voting_end: string
  status: string; min_hikes_to_vote: number; allow_all_members: boolean
  results_published_at: string | null
}
interface MyNomination { id: string; position_id: string; is_approved: boolean }

export default function ElectionPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [election, setElection]       = useState<Election | null>(null)
  const [positions, setPositions]     = useState<Position[]>([])
  const [candidates, setCandidates]   = useState<Candidate[]>([])
  const [myVotes, setMyVotes]         = useState<Record<string, string>>({})
  const [selections, setSelections]   = useState<Record<string, string>>({})
  const [userId, setUserId]           = useState<string | null>(null)
  const [hikeCount, setHikeCount]     = useState(0)
  const [isSenior, setIsSenior]       = useState(false)
  const [myNominations, setMyNominations] = useState<MyNomination[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [nominatingPos, setNominatingPos] = useState<string | null>(null)
  const [manifestoText, setManifestoText] = useState("")
  const [expandedManifesto, setExpandedManifesto] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setUserId(user.id)
      const [profileRes, myNomsRes, votesRes] = await Promise.all([
        supabase.from("profiles").select("completed_hikes_count,is_senior_member,role").eq("id", user.id).single(),
        supabase.from("election_candidates").select("id,position_id,is_approved").eq("election_id", id).eq("user_id", user.id),
        supabase.from("election_votes").select("position_id,candidate_id").eq("election_id", id).eq("voter_id", user.id),
      ])
      setHikeCount(profileRes.data?.completed_hikes_count || 0)
      const senior = profileRes.data?.is_senior_member || ["super_admin","admin","senior_member"].includes(profileRes.data?.role || "")
      setIsSenior(!!senior)
      setMyNominations(myNomsRes.data || [])
      const voteMap: Record<string, string> = {}
      votesRes.data?.forEach((v) => { voteMap[v.position_id] = v.candidate_id })
      setMyVotes(voteMap)
      setSelections(voteMap)
    }

    const [elRes, posRes, candRes] = await Promise.all([
      supabase.from("elections").select("*").eq("id", id).single(),
      supabase.from("election_positions").select("id,title,sort_order").eq("election_id", id).order("sort_order"),
      supabase.from("election_candidates").select("id,position_id,user_id,manifesto,vote_count,is_approved").eq("election_id", id),
    ])

    // Fetch profiles separately
    const rawCands = candRes.data || []
    let profileMap: Record<string, { full_name: string; avatar_url: string | null; city: string | null }> = {}
    if (rawCands.length > 0) {
      const uids = [...new Set(rawCands.map((c) => c.user_id))]
      const { data: profs } = await supabase.from("profiles").select("id,full_name,avatar_url,city").in("id", uids)
      if (profs) profileMap = Object.fromEntries(profs.map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url, city: p.city }]))
    }

    setElection(elRes.data)
    setPositions(posRes.data || [])
    setCandidates(rawCands.map((c) => ({ ...c, profile: profileMap[c.user_id] || null })) as unknown as Candidate[])
    setLoading(false)
  }, [id])

  useEffect(() => { if (id) load() }, [id, load])

  // ── State flags ───────────────────────────────────────────
  const isNominationsOpen = election?.status === "nominations_open"
  const isVotingOpen      = election?.status === "voting_open"
  const isPublished       = election?.status === "results_published"
  const isClosed          = election?.status === "closed"

  // A candidate is blocked from voting only if their nomination is approved
  const isApprovedCandidate = myNominations.some((n) => n.is_approved)

  const allowAll    = election?.allow_all_members ?? true
  const minHikes    = election?.min_hikes_to_vote ?? 0
  const meetsHikeReq = isSenior || allowAll || hikeCount >= minHikes

  const canVote = !!(userId && !isApprovedCandidate && isVotingOpen && meetsHikeReq)
  const hasVoted = Object.keys(myVotes).length > 0

  // ── Nominate self ─────────────────────────────────────────
  const nominateSelf = async (positionId: string) => {
    if (!userId) { router.push("/auth/login"); return }
    if (!isSenior) { toast.error("Only senior members can nominate"); return }
    setNominatingPos(positionId)
    const { error } = await supabase.from("election_candidates").insert({
      election_id: id, position_id: positionId,
      user_id: userId, manifesto: manifestoText.trim() || null,
      nominated_by: userId, is_approved: false,
    })
    setNominatingPos(null); setManifestoText("")
    if (error) {
      if (error.code === "23505") toast.error("Already nominated for this position")
      else toast.error(error.message)
    } else { toast.success("Nomination submitted! Awaiting admin approval."); load() }
  }

  const withdrawNomination = async (nomId: string) => {
    if (!confirm("Withdraw your nomination?")) return
    const { error } = await supabase.from("election_candidates").delete().eq("id", nomId).eq("user_id", userId!)
    if (error) toast.error(error.message)
    else { toast.success("Nomination withdrawn"); load() }
  }

  // ── Submit votes ──────────────────────────────────────────
  const submitVotes = async () => {
    if (!userId) { toast.error("Please sign in"); return }
    const newSel = Object.entries(selections).filter(([posId]) => !myVotes[posId])
    if (newSel.length === 0) { toast.error("Select at least one candidate first"); return }
    setSubmitting(true)
    const votes = newSel.map(([posId, candId]) => ({
      election_id: id, position_id: posId, voter_id: userId, candidate_id: candId,
    }))
    const { error } = await supabase.from("election_votes").insert(votes)
    setSubmitting(false)
    if (error) {
      if (error.code === "23505") toast.error("Already voted for one of these positions")
      else toast.error("Vote failed: " + error.message)
    } else {
      toast.success("🎉 Votes submitted successfully!")
      setMyVotes({ ...myVotes, ...Object.fromEntries(newSel) })
      setSelections((s) => ({ ...s, ...Object.fromEntries(newSel) }))
    }
  }

  // ── Loading / not found ───────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#0a1f1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#A4AA83] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#A4AA83] text-sm">Loading election...</p>
      </div>
    </div>
  )
  if (!election) return (
    <div className="min-h-screen bg-[#F5F4EF] flex items-center justify-center">
      <p className="text-[#6b6b5e]">Election not found.</p>
    </div>
  )

  const newSelectionsCount = Object.keys(selections).filter((p) => !myVotes[p]).length

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F4EF]">

        {/* ── Hero banner ── */}
        <div className="bg-gradient-to-br from-[#0a1f1a] via-[#173D35] to-[#0a1f1a] pt-28 pb-14 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isVotingOpen      ? "bg-green-500/20 border-green-400/30 text-green-300"
                : isNominationsOpen ? "bg-blue-500/20 border-blue-400/30 text-blue-300"
                : isPublished       ? "bg-yellow-500/20 border-yellow-400/30 text-yellow-300"
                : "bg-white/10 border-white/20 text-white/60"
              }`}>
                {isVotingOpen ? <Vote className="w-3 h-3" /> : isPublished ? <Trophy className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {election.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">{election.title}</h1>
            {election.description && <p className="text-white/60 text-base mb-4">{election.description}</p>}
            <div className="flex flex-wrap gap-5 text-xs text-white/40">
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Nominations: {formatDate(election.nomination_start)} – {formatDate(election.nomination_end)}</span>
              <span className="flex items-center gap-1.5"><Vote className="w-3.5 h-3.5" /> Voting: {formatDate(election.voting_start)} – {formatDate(election.voting_end)}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

          {/* ── Status banners ── */}
          {!userId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Sign in to participate</p>
                <button onClick={() => router.push("/auth/login?redirect=/elections/" + id)} className="text-xs text-amber-700 underline mt-1">Sign in now →</button>
              </div>
            </div>
          )}

          {/* Candidate banner */}
          {isApprovedCandidate && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="font-semibold text-blue-800 text-sm mb-1.5">🏅 You are a candidate in this election</p>
              <div className="space-y-1">
                {myNominations.filter((n) => n.is_approved).map((nom) => {
                  const pos = positions.find((p) => p.id === nom.position_id)
                  return <p key={nom.id} className="text-xs text-blue-700">✓ {pos?.title}</p>
                })}
              </div>
              <p className="text-xs text-blue-500 mt-2">Candidates cannot vote in the same election.</p>
            </div>
          )}

          {/* Already voted */}
          {hasVoted && !isApprovedCandidate && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-green-800">Your votes have been recorded. Thank you!</p>
            </div>
          )}

          {/* Voting not open */}
          {userId && !isVotingOpen && !isNominationsOpen && !isPublished && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-3 items-center">
              <Lock className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-500">
                {isClosed ? "Voting has ended. Results will be published soon." : "This election is not currently active."}
              </p>
            </div>
          )}

          {/* Hike requirement not met */}
          {userId && isVotingOpen && !isApprovedCandidate && !meetsHikeReq && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">This election requires {minHikes} completed hikes. You have {hikeCount}.</p>
            </div>
          )}

          {/* Voting is open — show eligible banner */}
          {canVote && !hasVoted && (
            <div className="bg-[#173D35] rounded-2xl p-4 flex items-center gap-3">
              <Vote className="w-5 h-5 text-[#A4AA83] flex-shrink-0" />
              <p className="text-sm text-white font-medium">Voting is open — select one candidate per position below, then submit your votes.</p>
            </div>
          )}

          {/* ── POSITIONS ── */}
          <div className="space-y-4">
            {positions.map((pos, pi) => {
              const approvedCands = candidates.filter((c) => c.position_id === pos.id && c.is_approved)
              const allCands      = candidates.filter((c) => c.position_id === pos.id)
              const alreadyVoted  = !!myVotes[pos.id]
              const mySelection   = selections[pos.id]
              const myNomHere     = myNominations.find((n) => n.position_id === pos.id)
              const isNomHere     = nominatingPos === pos.id

              return (
                <div key={pos.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Position header */}
                  <div className={`flex items-center gap-3 px-5 py-4 ${alreadyVoted ? "bg-green-50 border-b border-green-100" : "border-b border-gray-100"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${alreadyVoted ? "bg-green-500 text-white" : "bg-[#173D35] text-white"}`}>
                      {alreadyVoted ? <CheckCircle className="w-4 h-4" /> : pi + 1}
                    </div>
                    <h2 className="font-display font-bold text-[#171B19] flex-1 text-base">{pos.title}</h2>
                    {alreadyVoted && <span className="text-xs text-green-600 font-semibold">✓ Voted</span>}
                    {isVotingOpen && !alreadyVoted && approvedCands.length > 0 && canVote && (
                      <span className="text-xs text-[#173D35] bg-[#173D35]/8 px-2 py-0.5 rounded-full">{approvedCands.length} candidate{approvedCands.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>

                  <div className="p-5">
                    {/* ── NOMINATIONS PHASE ── */}
                    {isNominationsOpen && isSenior && !myNomHere && (
                      <div className="bg-gradient-to-r from-[#173D35]/5 to-transparent rounded-xl p-4 border border-[#173D35]/15 mb-4">
                        <p className="text-sm font-semibold text-[#173D35] mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4" /> Nominate yourself for this position
                        </p>
                        {isNomHere ? (
                          <div className="space-y-3">
                            <textarea value={manifestoText} onChange={(e) => setManifestoText(e.target.value)}
                              placeholder="Your manifesto — what will you do in this role? (optional)"
                              rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#173D35]/20 resize-none" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => nominateSelf(pos.id)}>Submit Nomination</Button>
                              <Button size="sm" variant="outline" onClick={() => { setNominatingPos(null); setManifestoText("") }}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => setNominatingPos(pos.id)}>
                            <Award className="w-4 h-4" /> Nominate Myself
                          </Button>
                        )}
                      </div>
                    )}

                    {isNominationsOpen && myNomHere && (
                      <div className="flex items-center justify-between gap-3 bg-blue-50 rounded-xl p-3 border border-blue-200 mb-4">
                        <p className="text-sm text-blue-700">
                          {myNomHere.is_approved ? "✓ Your nomination is approved" : "⏳ Your nomination is pending admin approval"}
                        </p>
                        {!myNomHere.is_approved && (
                          <button onClick={() => withdrawNomination(myNomHere.id)} className="text-xs text-red-500 hover:underline flex-shrink-0">Withdraw</button>
                        )}
                      </div>
                    )}

                    {isNominationsOpen && allCands.length > 0 && !myNomHere && (
                      <p className="text-xs text-gray-400 mb-2">{allCands.length} nomination{allCands.length !== 1 ? "s" : ""} — candidates shown once voting opens.</p>
                    )}

                    {/* ── VOTING PHASE ── */}
                    {(isVotingOpen || isPublished) && (
                      approvedCands.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No approved candidates for this position</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {approvedCands.map((cand) => {
                            const profile = cand.profile
                            const isSelected = mySelection === cand.id && !alreadyVoted
                            const isVoted    = myVotes[pos.id] === cand.id
                            const showManifesto = expandedManifesto === cand.id
                            const initials = profile?.full_name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"

                            return (
                              <div key={cand.id} className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!canVote || alreadyVoted) return
                                    setSelections((s) => ({
                                      ...s,
                                      [pos.id]: s[pos.id] === cand.id ? "" : cand.id, // toggle
                                    }))
                                  }}
                                  className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-150
                                    ${isVoted    ? "border-green-500 bg-green-50 cursor-default"
                                    : isSelected ? "border-[#173D35] bg-[#173D35]/5 shadow-md"
                                    : canVote && !alreadyVoted ? "border-gray-200 hover:border-[#173D35]/50 hover:bg-gray-50 cursor-pointer"
                                    : "border-gray-200 bg-gray-50/50 cursor-default opacity-90"}`}
                                >
                                  <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                                      isVoted ? "bg-green-500 text-white" : isSelected ? "bg-[#173D35] text-white" : "bg-[#173D35]/10 text-[#173D35]"
                                    }`}>
                                      {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-[#171B19] text-sm leading-tight">{profile?.full_name || "Unknown"}</p>
                                      {profile?.city && <p className="text-xs text-gray-400 mt-0.5">{profile.city}</p>}
                                      {isPublished && cand.vote_count > 0 && (
                                        <p className="text-xs font-bold text-[#173D35] mt-1">{cand.vote_count} vote{cand.vote_count !== 1 ? "s" : ""}</p>
                                      )}
                                    </div>
                                    {/* Check indicator */}
                                    {(isSelected || isVoted) && (
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isVoted ? "bg-green-500" : "bg-[#173D35]"}`}>
                                        <CheckCircle className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                    {!isSelected && !isVoted && canVote && !alreadyVoted && (
                                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                    )}
                                  </div>
                                </button>

                                {/* Manifesto toggle */}
                                {cand.manifesto && (
                                  <>
                                    <button onClick={() => setExpandedManifesto(showManifesto ? null : cand.id)}
                                      className="flex items-center gap-1 text-xs text-[#173D35]/70 hover:text-[#173D35] px-1 w-fit transition-colors">
                                      {showManifesto ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      {showManifesto ? "Hide manifesto" : "Read manifesto"}
                                    </button>
                                    {showManifesto && (
                                      <div className="bg-[#F5F4EF] rounded-xl p-3 text-xs text-gray-600 border border-gray-200 italic leading-relaxed">
                                        &ldquo;{cand.manifesto}&rdquo;
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── SUBMIT BUTTON ── */}
          {isVotingOpen && canVote && !hasVoted && (
            <div className="sticky bottom-4 z-20">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#171B19]">
                    {newSelectionsCount > 0 ? `${newSelectionsCount} vote${newSelectionsCount !== 1 ? "s" : ""} selected` : "No votes selected yet"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Select one candidate per position, then submit</p>
                </div>
                <Button
                  onClick={submitVotes}
                  disabled={submitting || newSelectionsCount === 0}
                  size="lg"
                  className="flex-shrink-0"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Vote className="w-4 h-4" /> Submit Votes</>}
                </Button>
              </div>
            </div>
          )}

          {/* ── RESULTS (published) ── */}
          {isPublished && (
            <div className="bg-gradient-to-r from-[#173D35] to-[#0a1f1a] rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="font-display font-bold text-white text-xl mb-1">Election Results Published</h3>
              <p className="text-[#A4AA83] text-sm">
                Results published on {election.results_published_at ? formatDate(election.results_published_at) : "—"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
