import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

const ALLOWED_ROLES = ["super_admin", "admin", "senior_member"]

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null
  return user
}

// GET — fetch all candidates + election + positions for an election (service role, bypasses RLS)
export async function GET(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const election_id = searchParams.get("election_id")
  if (!election_id) return NextResponse.json({ error: "election_id required" }, { status: 400 })

  const admin = createAdminClient()

  const [elRes, posRes, candRes] = await Promise.all([
    admin.from("elections")
      .select("id,title,status,nomination_start,nomination_end,voting_start,voting_end")
      .eq("id", election_id).single(),
    admin.from("election_positions")
      .select("id,title,sort_order")
      .eq("election_id", election_id)
      .order("sort_order"),
    // Fetch candidates WITHOUT join first — avoids FK name issues
    admin.from("election_candidates")
      .select("id,position_id,user_id,manifesto,is_approved,vote_count,approved_at")
      .eq("election_id", election_id)
      .order("created_at", { ascending: true }),
  ])

  if (elRes.error) return NextResponse.json({ error: elRes.error.message }, { status: 500 })

  const candidates = candRes.data || []

  // Fetch profiles for all candidate user_ids separately
  let profileMap: Record<string, { full_name: string; avatar_url: string | null; city: string | null }> = {}
  if (candidates.length > 0) {
    const userIds = [...new Set(candidates.map((c) => c.user_id))]
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,full_name,avatar_url,city")
      .in("id", userIds)
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url, city: p.city }]))
    }
  }

  // Merge profiles into candidates
  const enrichedCandidates = candidates.map((c) => ({
    ...c,
    profiles: profileMap[c.user_id] || null,
  }))

  return NextResponse.json({
    election: elRes.data,
    positions: posRes.data || [],
    candidates: enrichedCandidates,
  })
}

// PATCH — approve a candidate
export async function PATCH(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { candidate_id } = await req.json()
  if (!candidate_id) return NextResponse.json({ error: "candidate_id required" }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from("election_candidates").update({
    is_approved: true,
    approved_by: user.id,
    approved_at: new Date().toISOString(),
  }).eq("id", candidate_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — reject / remove a candidate
export async function DELETE(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { candidate_id } = await req.json()
  if (!candidate_id) return NextResponse.json({ error: "candidate_id required" }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from("election_candidates").delete().eq("id", candidate_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// POST — manually override election status (close nominations, open voting, etc.)
export async function POST(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { election_id, status } = await req.json()
  if (!election_id || !status) return NextResponse.json({ error: "election_id and status required" }, { status: 400 })

  const validStatuses = ["nominations_open", "nominations_closed", "voting_open", "closed"]
  if (!validStatuses.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from("elections").update({ status }).eq("id", election_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
