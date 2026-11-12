import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    // 1. Verify the user is authenticated
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

    // 2. Parse and validate the file
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 3MB)" }, { status: 400 })

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"]
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type. Use JPG, PNG or WebP." }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 3. Upload via service-role client — fully bypasses storage RLS
    const admin = createAdminClient()

    const storagePath = `${user.id}.${ext}`
    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // 4. Get the permanent public URL (no cache-buster on the stored URL,
    //    but we return one so the browser refreshes immediately)
    const { data: { publicUrl } } = admin.storage
      .from("avatars")
      .getPublicUrl(storagePath)

    const urlWithBust = `${publicUrl}?t=${Date.now()}`

    // 5. Save URL to profile — service role bypasses RLS here too
    const { error: profileError } = await admin
      .from("profiles")
      .update({ avatar_url: urlWithBust })
      .eq("id", user.id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: urlWithBust })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 }
    )
  }
}
