import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

const ALLOWED = ["super_admin", "admin", "senior_member", "executive"]

async function checkAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!p || !ALLOWED.includes(p.role)) return null
  return user
}

// POST — add media item
export async function POST(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { url, caption, photographer_name, album_id, media_type } = body
  if (!url || !album_id) return NextResponse.json({ error: "url and album_id required" }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin.from("gallery_media").insert({
    url, caption: caption || null,
    photographer_name: photographer_name || null,
    album_id, media_type: media_type || "image",
    uploaded_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

// DELETE — remove media item
export async function DELETE(req: NextRequest) {
  const user = await checkAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from("gallery_media").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
