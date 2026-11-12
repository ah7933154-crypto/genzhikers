import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["super_admin", "admin", "senior_member"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { election_id } = await req.json()
    if (!election_id) return NextResponse.json({ error: "election_id required" }, { status: 400 })

    const adminClient = createAdminClient()

    // Get all positions for this election
    const { data: positions } = await adminClient
      .from("election_positions")
      .select("id, title")
      .eq("election_id", election_id)

    if (!positions || positions.length === 0) {
      return NextResponse.json({ error: "No positions found for this election" }, { status: 404 })
    }

    const winners: { position: string; winner: string; votes: number }[] = []

    for (const pos of positions) {
      // Find candidate with max votes for this position
      const { data: candidates } = await adminClient
        .from("election_candidates")
        .select("id, user_id, vote_count")
        .eq("election_id", election_id)
        .eq("position_id", pos.id)
        .eq("is_approved", true)
        .order("vote_count", { ascending: false })
        .limit(1)

      if (!candidates || candidates.length === 0) continue
      const winner = candidates[0]
      if (winner.vote_count === 0) continue

      // Get winner's profile
      const { data: winnerProfile } = await adminClient
        .from("profiles")
        .select("full_name, role")
        .eq("id", winner.user_id)
        .single()

      if (!winnerProfile) continue

      // Set executive designation — preserve only super_admin role, everyone else becomes executive
      const newRole = winnerProfile.role === "super_admin" ? "super_admin" : "executive"

      await adminClient
        .from("profiles")
        .update({
          executive_designation: pos.title,
          election_won_at: new Date().toISOString(),
          role: newRole,
        })
        .eq("id", winner.user_id)

      // Also add executive to user_roles permanently
      await adminClient
        .from("user_roles")
        .upsert({
          user_id: winner.user_id,
          role: "executive",
          granted_by: user.id,
          is_permanent: true,
        }, { onConflict: "user_id,role" })

      winners.push({
        position: pos.title,
        winner: winnerProfile.full_name,
        votes: winner.vote_count,
      })
    }

    // Mark election as results_published — works from any non-published state
    await adminClient
      .from("elections")
      .update({
        status: "results_published",
        results_published_at: new Date().toISOString(),
      })
      .eq("id", election_id)

    return NextResponse.json({ success: true, winners })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
