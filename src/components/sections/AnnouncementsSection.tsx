"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Bell, Pin, AlertTriangle, Calendar, ChevronRight, Megaphone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  is_urgent: boolean
  is_pinned: boolean
  published_at: string
  image_url: string | null
}

const categoryConfig: Record<string, { label: string; variant: string }> = {
  upcoming_hikes: { label: "Upcoming Hikes", variant: "success" },
  important_notices: { label: "Important Notice", variant: "destructive" },
  elections: { label: "Elections", variant: "info" },
  membership: { label: "Membership", variant: "default" },
  events: { label: "Events", variant: "secondary" },
  general: { label: "General", variant: "secondary" },
}

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("announcements")
        .select("id,title,content,category,is_urgent,is_pinned,published_at,image_url")
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(5)
      setAnnouncements(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section id="announcements" className="section-padding bg-[#F5F4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Left col - Header */}
          <div className="lg:col-span-1">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block"
            >
              Stay Updated
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="font-display font-bold text-4xl text-[#171B19] leading-tight mb-4"
            >
              Community
              <br />
              <span className="text-[#173D35]">Announcements</span>
            </motion.h2>
            <p className="text-[#6b6b5e] text-sm leading-relaxed mb-6">
              Official updates, news, event details, and important notices from the GenZ Hikers team.
            </p>

            {/* Social links */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#171B19] uppercase tracking-wider">Follow Us</p>
              {[
                { label: "Instagram", href: "https://www.instagram.com/genz_hikers/", handle: "@genz_hikers" },
                { label: "WhatsApp Channel", href: "https://whatsapp.com/channel/0029VbDl4tzEFeXfMtxJVu08", handle: "Join Channel" },
                { label: "Instagram Group", href: "https://ig.me/j/xz3NB6N_9dQB81gG", handle: "Join Group" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-[#173D35]/10 hover:border-[#173D35]/30 transition-all group"
                >
                  <span className="text-sm font-medium text-[#171B19]">{s.label}</span>
                  <span className="text-xs text-[#A4AA83] group-hover:text-[#173D35] transition-colors">{s.handle}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Right col - Announcements */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Megaphone className="w-8 h-8 text-[#A4AA83] mb-3" />
                <p className="text-[#6b6b5e]">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann, i) => {
                  const cat = categoryConfig[ann.category] || categoryConfig.general
                  return (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.08 }}
                      className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                        ann.is_urgent
                          ? "border-red-200 bg-red-50/30"
                          : ann.is_pinned
                          ? "border-[#173D35]/20"
                          : "border-[#173D35]/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            ann.is_urgent ? "bg-red-100" : "bg-[#173D35]/8"
                          }`}>
                            {ann.is_urgent ? (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            ) : ann.is_pinned ? (
                              <Pin className="w-4 h-4 text-[#173D35]" />
                            ) : (
                              <Bell className="w-4 h-4 text-[#173D35]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge variant={cat.variant as "default" | "secondary" | "success" | "warning" | "destructive" | "info"} className="text-xs">
                                {cat.label}
                              </Badge>
                              {ann.is_urgent && (
                                <Badge variant="destructive" className="text-xs">Urgent</Badge>
                              )}
                            </div>
                            <h3 className="font-display font-semibold text-sm text-[#171B19] mb-1 leading-tight">
                              {ann.title}
                            </h3>
                            <p className="text-xs text-[#6b6b5e] line-clamp-2 leading-relaxed">
                              {ann.content}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[#9c9c8f] flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(ann.published_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}

                <Link
                  href="/announcements"
                  className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#173D35] hover:text-[#1e5045] transition-colors"
                >
                  View all announcements
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
