import React from "react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Vote, CheckCircle, Lock, ChevronRight, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function DashboardElectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [electionsRes, profileRes] = await Promise.all([
    supabase
      .from("elections")
      .select("id,title,description,voting_start,voting_end,nomination_start,nomination_end,status,min_hikes_to_vote,allow_all_members")
      .neq("status", "draft")
      .order("voting_start", { ascending: false }),
    supabase
      .from("profiles")
      .select("completed_hikes_count,is_senior_member,role")
      .eq("id", user.id)
      .single(),
  ])

  const elections = electionsRes.data || []
  const profile = profileRes.data
  const hikeCount = profile?.completed_hikes_count || 0
  const isSenior = profile?.is_senior_member || ["super_admin","admin","senior_member"].includes(profile?.role || "")

  const statusColors: Record<string, string> = {
    nominations_open:   "info",
    nominations_closed: "warning",
    voting_open:        "success",
    closed:             "secondary",
    results_published:  "default",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Elections</h1>
        <p className="text-sm text-[#6b6b5e] mt-1">Community elections and voting.</p>
      </div>

      {elections.length === 0 ? (
        <div className="text-center py-12">
          <Vote className="w-10 h-10 text-[#A4AA83]/40 mx-auto mb-3" />
          <p className="text-[#6b6b5e]">No elections currently running.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((election) => {
            // Per-election eligibility check
            const minHikes = election.min_hikes_to_vote ?? 0
            const allowAll = election.allow_all_members ?? true
            const canVote = isSenior || allowAll || hikeCount >= minHikes

            return (
              <div key={election.id} className="bg-white rounded-xl border border-[#173D35]/10 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Badge
                      variant={(statusColors[election.status] || "secondary") as "default"|"secondary"|"success"|"warning"|"destructive"|"info"}
                      className="mb-2 capitalize text-xs"
                    >
                      {election.status.replace(/_/g, " ")}
                    </Badge>
                    <h3 className="font-display font-bold text-[#171B19]">{election.title}</h3>
                    {election.description && (
                      <p className="text-sm text-[#6b6b5e] mt-1">{election.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#9c9c8f]">
                      {(election.status === "nominations_open" || election.status === "nominations_closed") && (
                        <span>📋 Nominations: {formatDate(election.nomination_start)} – {formatDate(election.nomination_end)}</span>
                      )}
                      <span>🗳️ Voting: {formatDate(election.voting_start)} – {formatDate(election.voting_end)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {election.status === "voting_open" && canVote && (
                      <Link
                        href={`/elections/${election.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#173D35] text-white rounded-lg text-xs font-medium hover:bg-[#1e5045] transition-colors"
                      >
                        Vote Now <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {election.status === "nominations_open" && isSenior && (
                      <Link
                        href={`/elections/${election.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Nominate <Award className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <Link
                      href={`/elections/${election.id}`}
                      className="text-xs text-[#173D35] hover:underline text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Per-election eligibility status */}
                {election.status === "voting_open" && (
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    canVote
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-amber-50 border border-amber-200 text-amber-700"
                  }`}>
                    {canVote ? (
                      <><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> You are eligible to vote</>
                    ) : (
                      <><Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        {allowAll
                          ? "Sign in to vote"
                          : `You need ${minHikes - hikeCount} more hike${(minHikes - hikeCount) !== 1 ? "s" : ""} to vote (${hikeCount}/${minHikes} required)`
                        }
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
