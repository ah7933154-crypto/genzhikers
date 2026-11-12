import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

const SUPER_ADMIN_EMAIL = "ah7933154@gmail.com"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: actor } = await supabase.from("profiles").select("role, email").eq("id", user.id).single()
    if (!actor || !["super_admin", "admin", "senior_member"].includes(actor.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { user_id, updates } = await req.json()
    const adminClient = createAdminClient()

    // Get target profile to enforce protection rules
    const { data: target } = await adminClient.from("profiles").select("email, role").eq("id", user_id).single()

    // Rule 1: Nobody can ever demote the founding super_admin
    if (target?.email === SUPER_ADMIN_EMAIL && updates.role && updates.role !== "super_admin") {
      return NextResponse.json({ error: "The founding admin's role cannot be changed." }, { status: 403 })
    }

    // Rule 2: Only the founding super_admin can grant/revoke super_admin
    if (updates.role === "super_admin" && actor.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Only the founding admin can grant super_admin role." }, { status: 403 })
    }

    // Rule 3: Non-super_admins cannot change roles of other super_admins
    if (target?.role === "super_admin" && actor.role !== "super_admin") {
      return NextResponse.json({ error: "Cannot modify a super_admin's profile." }, { status: 403 })
    }

    const { error } = await adminClient.from("profiles").update(updates).eq("id", user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
