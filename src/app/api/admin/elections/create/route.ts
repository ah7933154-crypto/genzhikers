import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()

    const allowed = ["super_admin", "admin", "senior_member"]
    if (!profile || !allowed.includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await req.json()
    const {
      title, description,
      nomination_start, nomination_end,
      voting_start, voting_end,
      results_announce_at,
      allow_all_members,
      min_hikes_to_vote,
      status,
      positions,
    } = body

    if (!title || !voting_start || !voting_end) {
      return NextResponse.json(
        { error: "title, voting_start and voting_end are required" },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Build insert payload — only include columns we know exist
    const electionPayload: Record<string, unknown> = {
      title,
      description: description || null,
      nomination_start: nomination_start || voting_start,
      nomination_end: nomination_end || voting_start,
      voting_start,
      voting_end,
      allow_all_members: allow_all_members ?? true,
      min_hikes_to_vote: (allow_all_members ?? true) ? 0 : (min_hikes_to_vote || 0),
      status: status || "draft",
      created_by: user.id,
    }

    // Conditionally add results_announce_at (requires migration 004)
    if (results_announce_at) {
      electionPayload.results_announce_at = results_announce_at
    }

    const { data: election, error: elErr } = await adminClient
      .from("elections")
      .insert(electionPayload)
      .select()
      .single()

    if (elErr) {
      console.error("Election insert error:", elErr)
      return NextResponse.json({ error: elErr.message }, { status: 500 })
    }

    // Create positions
    if (positions && Array.isArray(positions) && positions.length > 0) {
      const posRows = positions.map((posTitle: string, i: number) => ({
        election_id: election.id,
        title: posTitle,
        sort_order: i + 1,
      }))

      const { error: posErr } = await adminClient
        .from("election_positions")
        .insert(posRows)

      if (posErr) {
        console.error("Positions insert error:", posErr)
        // Election created — just warn about positions
        return NextResponse.json({
          success: true,
          election,
          warning: "Election created but positions failed: " + posErr.message,
        })
      }
    }

    return NextResponse.json({ success: true, election })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    console.error("Election create error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
