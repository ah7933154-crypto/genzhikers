import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

async function checkAdmin(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!p || !["super_admin", "admin", "senior_member", "organizer"].includes(p.role)) return null
  return user
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await checkAdmin(supabase)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const body = await req.json()
    const adminClient = createAdminClient()

    // Ensure required integer fields are never null/NaN
    const sanitized = {
      ...body,
      max_participants: parseInt(body.max_participants) || 30,
      registration_fee: parseFloat(body.registration_fee) ?? 0,
    }

    const { data, error } = await adminClient
      .from("hike_events")
      .insert({ ...sanitized, created_by: user.id })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await checkAdmin(supabase)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { id, updates } = await req.json()
    const adminClient = createAdminClient()

    const { error } = await adminClient.from("hike_events").update(updates).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const user = await checkAdmin(supabase)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

    const { id } = await req.json()
    const adminClient = createAdminClient()

    const { error } = await adminClient.from("hike_events").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
