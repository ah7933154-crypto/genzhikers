import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server"

const WHATSAPP_GROUP = "https://whatsapp.com/channel/0029VbDl4tzEFeXfMtxJVu08"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

    const body = await req.json()
    const { emergency_type, lat, lng } = body

    const admin = createAdminClient()

    // 1. Get sender's full profile + emergency contacts
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone, city, emergency_contact_name, emergency_contact_phone, emergency_contact_relation")
      .eq("id", user.id)
      .single()

    const memberName            = profile?.full_name || user.email || "Unknown"
    const memberPhone           = profile?.phone || "Not provided"
    const emergencyContactName  = profile?.emergency_contact_name || "Not set"
    const emergencyContactPhone = profile?.emergency_contact_phone || "Not set"
    const locationStr           = lat && lng
      ? `https://maps.google.com/?q=${lat},${lng}`
      : profile?.city ? profile.city : "Location unknown"

    // 2. Save to safety_incidents
    await admin.from("safety_incidents").insert({
      reported_by: user.id,
      incident_type: emergency_type || "Emergency",
      description: `SOS Emergency: ${emergency_type} — ${memberName}`,
      severity: "critical",
      latitude: lat || null,
      longitude: lng || null,
      status: "open",
    })

    // 3. Build alert message
    const alertTitle = `🚨 SOS EMERGENCY — ${memberName}`
    const alertMessage =
      `🚨 EMERGENCY ALERT!\n\n` +
      `A GenZ Hikers member needs immediate assistance.\n\n` +
      `👤 Member: ${memberName}\n` +
      `📱 Contact: ${memberPhone}\n` +
      `🆘 Emergency: ${emergency_type || "Emergency"}\n` +
      `📍 Location: ${locationStr}\n` +
      `🔴 Emergency Contact: ${emergencyContactName} — ${emergencyContactPhone}\n\n` +
      `Please respond immediately.`

    // 4. Find who to notify:
    //    a) All members registered for the SAME upcoming/ongoing hike as the sender
    //    b) All admins/organizers regardless
    //    c) All active members as fallback if no active hike found

    // Find the sender's active hike registration(s)
    const { data: senderRegs } = await admin
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", user.id)
      .in("status", ["approved", "confirmed", "attended"])

    let recipientIds: string[] = []

    if (senderRegs && senderRegs.length > 0) {
      // Get all other registrants for the same hike(s)
      const eventIds = senderRegs.map((r) => r.event_id)
      const { data: coRegistrants } = await admin
        .from("event_registrations")
        .select("user_id")
        .in("event_id", eventIds)
        .in("status", ["approved", "confirmed", "attended"])
        .neq("user_id", user.id)

      recipientIds = [...new Set((coRegistrants || []).map((r) => r.user_id))]
    }

    // Always include admins/seniors regardless
    const { data: adminUsers } = await admin
      .from("profiles")
      .select("id")
      .in("role", ["super_admin", "admin", "senior_member", "executive"])

    const adminIds = (adminUsers || []).map((u) => u.id).filter((id) => id !== user.id)
    recipientIds = [...new Set([...recipientIds, ...adminIds])]

    // If still empty (no hike registered), notify all active members
    if (recipientIds.length === 0) {
      const { data: allMembers } = await admin
        .from("profiles")
        .select("id")
        .eq("membership_status", "active")
        .neq("id", user.id)
      recipientIds = (allMembers || []).map((m) => m.id)
    }

    // 5. Insert notifications in batches of 50
    if (recipientIds.length > 0) {
      const notifications = recipientIds.map((id) => ({
        user_id: id,
        title: alertTitle,
        message: alertMessage,
        type: "sos",
        is_read: false,
        link: lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : "/dashboard/safety",
      }))

      for (let i = 0; i < notifications.length; i += 50) {
        await admin.from("notifications").insert(notifications.slice(i, i + 50))
      }
    }

    // 6. WhatsApp URL with pre-filled message
    const waMessage = encodeURIComponent(
      `🚨 EMERGENCY ALERT!\n` +
      `A GenZ Hikers member needs immediate assistance.\n\n` +
      `• Member: ${memberName}\n` +
      `• Emergency: ${emergency_type || "Emergency"}\n` +
      `• Contact: ${memberPhone}\n` +
      `• Location: ${locationStr}\n\n` +
      `Please contact the member immediately.`
    )

    return NextResponse.json({
      success: true,
      recipientCount: recipientIds.length,
      whatsappUrl: `https://wa.me/?text=${waMessage}`,
      whatsappGroupUrl: WHATSAPP_GROUP,
      memberName,
      alertMessage,
      mapsUrl: lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : null,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 })
  }
}
