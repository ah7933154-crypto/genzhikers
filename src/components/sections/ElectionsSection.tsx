"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Vote, CheckCircle, Clock, Shield, ChevronRight, Award, Trophy, Crown, Star, Briefcase, Users, Megaphone, BarChart3, Cpu } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface Election {
  id: string
  title: string
  description: string | null
  voting_start: string
  voting_end: string
  status: string
  nomination_start: string
  nomination_end: string
  results_published_at: string | null
}

interface ElectionResult {
  election_id: string
  election_title: string
  position: string
  winner: string
  vote_count: number
  results_published_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  nominations_open:  { label: "Nominations Open",  color: "info",      icon: Award },
  nominations_closed:{ label: "Nominations Closed", color: "warning",   icon: Clock },
  voting_open:       { label: "Voting Open",        color: "success",   icon: Vote },
  closed:            { label: "Voting Closed",      color: "secondary", icon: CheckCircle },
  results_published: { label: "Results Published",  color: "default",   icon: Trophy },
}

const POSITIONS = [
  "President",
  "Vice President",
  "General Secretary",
  "Director of Operations",
  "Director of Media & Communications",
  "Director of Community Engagement",
  "Director of Finance & Partnerships",
  "Director of Technology & Development",
]

// Position → icon + color
const POSITION_BADGES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "President":                             { icon: Crown,     color: "text-yellow-700",  bg: "bg-yellow-50 border-yellow-200" },
  "Vice President":                        { icon: Award,     color: "text-orange-700",  bg: "bg-orange-50 border-orange-200" },
  "General Secretary":                     { icon: Briefcase, color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  "Director of Operations":                { icon: BarChart3, color: "text-purple-700",  bg: "bg-purple-50 border-purple-200" },
  "Director of Media & Communications":    { icon: Megaphone, color: "text-pink-700",    bg: "bg-pink-50 border-pink-200" },
  "Director of Community Engagement":      { icon: Users,     color: "text-green-700",   bg: "bg-green-50 border-green-200" },
  "Director of Finance & Partnerships":    { icon: Star,      color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200" },
  "Director of Technology & Development":  { icon: Cpu,       color: "text-teal-700",    bg: "bg-teal-50 border-teal-200" },
}

function CelebrationBanner({ electionTitle }: { electionTitle: string }) {
  const [show, setShow] = useState(true)
  if (!show) return null
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#173D35] via-[#1e5045] to-[#173D35] border border-[#A4AA83]/30 p-6 mb-8">
      {/* Confetti-like dots */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-40 animate-bounce"
          style={{
            left: `${(i * 17 + 5) % 100}%`,
            top: `${(i * 23 + 10) % 80}%`,
            animationDelay: `${(i * 0.15) % 1.5}s`,
            animationDuration: `${1.2 + (i % 4) * 0.3}s`,
            backgroundColor: ["#A4AA83","#F5F4EF","#fbbf24","#34d399","#60a5fa"][i % 5],
          }}
        />
      ))}
      <div className="relative z-10 text-center">
        <div className="text-4xl mb-2">🎉🏆🎊</div>
        <h3 className="font-display font-bold text-white text-2xl mb-1">Congratulations!</h3>
        <p className="text-[#A4AA83] text-sm">{electionTitle} — Results are in! Meet your new Executive Council.</p>
      </div>
      <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-white/40 hover:text-white text-xs">✕</button>
    </div>
  )
}

export default function ElectionsSection() {
  const [elections, setElections] = useState<Election[]>([])
  const [results, setResults] = useState<ElectionResult[]>([])
  const [loading, setLoading] = useState(true)
  const [celebrationElection, setCelebrationElection] = useState<Election | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: electionsData }, { data: resultsData }] = await Promise.all([
        supabase
          .from("elections")
          .select("id,title,description,voting_start,voting_end,status,nomination_start,nomination_end,results_published_at")
          .neq("status", "draft")
          .order("voting_start", { ascending: false })
          .limit(5),
        supabase
          .from("v_election_results")
          .select("*")
          .order("results_published_at", { ascending: false }),
      ])
      const els = electionsData || []
      setElections(els)
      setResults((resultsData as unknown as ElectionResult[]) || [])

      // Celebration: show for 30 min after results published
      const celebrated = els.find((e) => {
        if (e.status !== "results_published" || !e.results_published_at) return false
        const publishedAt = new Date(e.results_published_at)
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
        return publishedAt > thirtyMinAgo
      })
      setCelebrationElection(celebrated || null)
      setLoading(false)
    }
    load()
  }, [])

  // Group results by election
  const resultsByElection = results.reduce<Record<string, ElectionResult[]>>((acc, r) => {
    if (!acc[r.election_id]) acc[r.election_id] = []
    acc[r.election_id].push(r)
    return acc
  }, {})

  // Published elections with results
  const publishedElections = elections.filter((e) => e.status === "results_published")
  // Active/upcoming elections
  const activeElections = elections.filter((e) => e.status !== "results_published")

  return (
    <section id="elections" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block"
          >
            Democratic Governance
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-display font-bold text-4xl sm:text-5xl text-[#171B19] leading-tight mb-4"
          >
            Elections &
            <span className="text-[#173D35]"> Voting</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-[#6b6b5e] text-base leading-relaxed"
          >
            GenZ Hikers elects its Executive Council through a transparent, democratic process.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: positions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#F5F4EF] rounded-2xl p-6 border border-[#173D35]/10 sticky top-24"
            >
              <h3 className="font-display font-semibold text-[#171B19] text-base mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#173D35]" /> Executive Positions
              </h3>
              <ul className="space-y-2">
                {POSITIONS.map((pos, i) => {
                  const badge = POSITION_BADGES[pos]
                  const Icon = badge?.icon || Award
                  return (
                    <li key={pos} className="flex items-center gap-2 text-sm text-[#6b6b5e]">
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${badge?.color || "text-[#A4AA83]"}`} />
                      {pos}
                    </li>
                  )
                })}
              </ul>
              <div className="mt-6 pt-5 border-t border-[#173D35]/10 space-y-3">
                <div className="bg-white rounded-xl p-3 border border-[#173D35]/8">
                  <p className="text-xs font-semibold text-[#173D35] mb-1">Candidate Eligibility</p>
                  <p className="text-xs text-[#6b6b5e]">Must be an officially recognized senior member approved by the administration.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: elections */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => <div key={i} className="h-36 bg-[#173D35]/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <>
                {/* Celebration banner */}
                <AnimatePresence>
                  {celebrationElection && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                    >
                      <CelebrationBanner electionTitle={celebrationElection.title} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Published elections with results */}
                {publishedElections.map((election, i) => {
                  const elResults = resultsByElection[election.id] || []
                  return (
                    <motion.div
                      key={election.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-[#173D35]/10 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-5 border-b border-[#173D35]/8 bg-gradient-to-r from-[#173D35]/5 to-transparent">
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-amber-500" />
                          <Badge variant="default" className="text-xs">Results Published</Badge>
                          {election.results_published_at && (
                            <span className="text-xs text-gray-400">{formatDate(election.results_published_at)}</span>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-[#171B19] text-lg">{election.title}</h3>
                      </div>

                      {/* Winners grid */}
                      {elResults.length > 0 ? (
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {elResults.map((result) => {
                            const badge = POSITION_BADGES[result.position]
                            const Icon = badge?.icon || Award
                            return (
                              <div key={result.position} className={`flex items-center gap-3 p-3 rounded-xl border ${badge?.bg || "bg-gray-50 border-gray-200"}`}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${badge?.bg || "bg-gray-100"} border ${badge?.bg.includes("border") ? "" : "border-gray-200"}`}>
                                  <Icon className={`w-4 h-4 ${badge?.color || "text-gray-500"}`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-gray-500 truncate">{result.position}</p>
                                  <p className="font-semibold text-[#171B19] text-sm truncate">{result.winner}</p>
                                  <p className="text-xs text-gray-400">{result.vote_count} votes</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-5 text-center text-sm text-gray-400">Results are being tallied…</div>
                      )}
                    </motion.div>
                  )
                })}

                {/* Active / upcoming elections */}
                {activeElections.length === 0 && publishedElections.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center min-h-[200px] text-center bg-[#F5F4EF] rounded-2xl border border-[#173D35]/10 p-10"
                  >
                    <Vote className="w-10 h-10 text-[#A4AA83]/40 mb-4" />
                    <h3 className="font-display font-semibold text-[#171B19] mb-2">No Active Elections</h3>
                    <p className="text-sm text-[#6b6b5e]">Elections will be announced when it&apos;s time to elect the Executive Council.</p>
                  </motion.div>
                )}

                {activeElections.map((election, i) => {
                  const cfg = statusConfig[election.status] || statusConfig.closed
                  const StatusIcon = cfg.icon
                  return (
                    <motion.div
                      key={election.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="bg-white rounded-2xl border border-[#173D35]/10 p-6 hover:border-[#173D35]/25 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <Badge variant={cfg.color as "default"|"secondary"|"success"|"warning"|"destructive"|"info"} className="mb-2">
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {cfg.label}
                          </Badge>
                          <h3 className="font-display font-bold text-[#171B19] text-lg">{election.title}</h3>
                          {election.description && <p className="text-sm text-[#6b6b5e] mt-1 line-clamp-2">{election.description}</p>}
                        </div>
                      </div>
                      <div className="text-xs text-[#6b6b5e] mb-4 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>Nominations: {formatDate(election.nomination_start)} – {formatDate(election.nomination_end)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Voting: {formatDate(election.voting_start)} – {formatDate(election.voting_end)}</span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant={election.status === "voting_open" ? "default" : "outline"}>
                        <Link href={`/elections/${election.id}`}>
                          {election.status === "voting_open" ? "Cast Your Vote" : election.status === "nominations_open" ? "Nominate a Candidate" : "View Details"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </motion.div>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
