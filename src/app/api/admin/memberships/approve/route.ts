import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"
import { generateMembershipId } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { member_id, self_request } = body

    const adminClient = createAdminClient()

    // Self-request: any authenticated user can request their own card
    if (self_request) {
      const { error } = await adminClient
        .from("profiles")
        .update({ card_requested_at: new Date().toISOString() })
        .eq("id", user.id) // always use the authenticated user's own ID
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, type: "requested" })
    }

    // Admin approve: check admin role
    const { data: actor } = await supabase
      .from("profiles").select("role").eq("id", user.id).single()

    if (!actor || !["super_admin", "admin"].includes(actor.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: member } = await adminClient
      .from("profiles").select("membership_id").eq("id", member_id).single()

    const membershipId = member?.membership_id || generateMembershipId()

    const { error } = await adminClient.from("profiles").update({
      card_approved_at: new Date().toISOString(),
      card_approved_by: user.id,
      membership_id: membershipId,
      membership_status: "active",
    }).eq("id", member_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, membership_id: membershipId })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
