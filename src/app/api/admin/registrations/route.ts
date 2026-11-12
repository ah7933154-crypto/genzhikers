import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

const ALLOWED = ["super_admin", "admin", "senior_member", "organizer"]

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!p || !ALLOWED.includes(p.role)) return null
  return user
}

// GET — fetch all registrations with member + event data
export async function GET(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId     = searchParams.get("event_id")
  const statusParam = searchParams.get("status")

  const admin = createAdminClient()

  // Build registrations query
  let regQuery = admin
    .from("event_registrations")
    .select("id,event_id,user_id,status,payment_status,payment_amount,checked_in,checked_in_at,notes,created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (eventId && eventId !== "all") regQuery = regQuery.eq("event_id", eventId)
  if (statusParam && statusParam !== "all") regQuery = regQuery.eq("status", statusParam)

  const { data: regs, error: regErr } = await regQuery
  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 })
  if (!regs || regs.length === 0) return NextResponse.json({ registrations: [], events: [] })

  // Fetch profiles + events separately
  const userIds  = [...new Set(regs.map((r) => r.user_id))]
  const eventIds = [...new Set(regs.map((r) => r.event_id))]

  const [profilesRes, eventsRes] = await Promise.all([
    admin.from("profiles").select("id,full_name,email,phone,city,avatar_url").in("id", userIds),
    admin.from("hike_events").select("id,title,event_date,status").in("id", eventIds),
  ])

  const profileMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.id, p]))
  const eventMap   = Object.fromEntries((eventsRes.data  || []).map((e) => [e.id, e]))

  const enriched = regs.map((r) => ({
    ...r,
    member: profileMap[r.user_id]  || null,
    event:  eventMap[r.event_id]   || null,
  }))

  // Also return all events for the filter dropdown
  const { data: allEvents } = await admin
    .from("hike_events")
    .select("id,title,event_date")
    .order("event_date", { ascending: false })
    .limit(30)

  return NextResponse.json({ registrations: enriched, events: allEvents || [] })
}

// PATCH — update registration status / attendance
export async function PATCH(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { registration_id, updates } = await req.json()
  if (!registration_id) return NextResponse.json({ error: "registration_id required" }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from("event_registrations").update(updates).eq("id", registration_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
