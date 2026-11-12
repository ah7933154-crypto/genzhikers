"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, CheckCheck } from "lucide-react"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  link: string | null
}

const typeIcons: Record<string, string> = {
  general: "📢", registration: "🏔", event: "📅",
  membership: "🎫", announcement: "📣",
  safety: "⚠️", sos: "🆘", hike: "🥾",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)
    setNotifications((ns) => ns.map((n) => ({ ...n, is_read: true })))
    toast.success("All marked as read")
  }

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Notifications</h1>
          {unread > 0 && <p className="text-sm text-[#6b6b5e] mt-0.5">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-[#173D35] hover:underline">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-[#173D35]/10" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-[#A4AA83]/40 mx-auto mb-3" />
          <p className="text-[#6b6b5e]">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const isSOS = notif.type === "sos"
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                  isSOS
                    ? notif.is_read
                      ? "bg-red-50/60 border-red-200"
                      : "bg-red-50 border-red-400 ring-2 ring-red-300 shadow-md"
                    : notif.is_read
                    ? "bg-white border-[#173D35]/8"
                    : "bg-[#173D35]/3 border-[#173D35]/15"
                }`}
                onClick={() => {
                  if (!notif.is_read) markRead(notif.id)
                  if (notif.link) window.open(notif.link, "_blank")
                }}
              >
                <div className={`text-2xl flex-shrink-0 ${isSOS ? "animate-pulse" : ""}`}>
                  {typeIcons[notif.type] || "📢"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${isSOS ? "text-red-700" : notif.is_read ? "text-[#6b6b5e]" : "text-[#171B19]"}`}>
                    {notif.title}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed whitespace-pre-line ${isSOS ? "text-red-700/80" : "text-[#9c9c8f]"}`}>
                    {notif.message}
                  </p>
                  {notif.link && isSOS && (
                    <a href={notif.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}>
                      📍 View Location on Map
                    </a>
                  )}
                  <p className="text-xs text-[#9c9c8f] mt-1.5">{formatDate(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${isSOS ? "bg-red-500" : "bg-[#173D35]"}`} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
