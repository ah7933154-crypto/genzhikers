"use client"
import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import {
  LayoutDashboard, Users, Mountain, Calendar, Image as ImageIcon, Megaphone,
  MessageSquare, CreditCard, Shield, BarChart2, LogOut,
  Menu, X, Settings, UserCheck, ChevronRight, AlertTriangle, Award, ExternalLink
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LOGO_URL } from "@/lib/media"
import toast from "react-hot-toast"

interface Profile {
  id: string
  full_name: string
  role: string
  avatar_url: string | null
}

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
    ],
  },
  {
    label: "Community",
    items: [
      { href: "/admin/users", icon: Users, label: "Members" },
      { href: "/admin/authorities", icon: UserCheck, label: "Leadership" },
      { href: "/admin/authorities/designations", icon: Award, label: "Designations" },
      { href: "/admin/memberships", icon: CreditCard, label: "Membership Cards" },
    ],
  },
  {
    label: "Events",
    items: [
      { href: "/admin/hikes", icon: Mountain, label: "Hike Events" },
      { href: "/admin/registrations", icon: Calendar, label: "Registrations" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/gallery", icon: ImageIcon, label: "Gallery" },
      { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
      { href: "/admin/feedback", icon: MessageSquare, label: "Feedback" },
    ],
  },
  {
    label: "Safety",
    items: [
      { href: "/admin/incidents", icon: AlertTriangle, label: "Safety Reports" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", icon: Settings, label: "Settings" },
    ],
  },
]

export default function AdminSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out")
    router.push("/")
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1f1a] via-[#0f2820] to-[#0a1a16]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#A4AA83]/30 shadow-lg flex-shrink-0">
            <Image src={LOGO_URL} alt="GenZ Hikers" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">Admin Panel</p>
            <p className="text-[10px] text-[#A4AA83]/70 uppercase tracking-wider">GenZ Hikers</p>
          </div>
        </Link>
      </div>

      {/* Profile */}
      <div className="px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-[#A4AA83]/20 border border-[#A4AA83]/30 flex items-center justify-center text-[#A4AA83] font-bold text-sm flex-shrink-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name} width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              profile.full_name?.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile.full_name}</p>
            <p className="text-xs text-[#A4AA83]/60 capitalize">{profile.role.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navGroups.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: gi * 0.05, duration: 0.3 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A4AA83]/40 px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                      active
                        ? "bg-[#A4AA83]/15 text-[#A4AA83] border border-[#A4AA83]/20"
                        : "text-white/50 hover:bg-white/5 hover:text-white/90"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#A4AA83] rounded-full" />
                    )}
                    <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110", active ? "text-[#A4AA83]" : "")} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-[#A4AA83]/60" />}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/8 space-y-1">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/40 rounded-xl hover:bg-white/5 hover:text-white/70 transition-colors">
          <LayoutDashboard className="w-4 h-4" /> Member Dashboard
        </Link>
        <Link href="/" target="_blank" className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/40 rounded-xl hover:bg-white/5 hover:text-white/70 transition-colors">
          <ExternalLink className="w-4 h-4" /> View Website
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400/70 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a1f1a] border-b border-white/10 h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg overflow-hidden"><Image src={LOGO_URL} alt="GenZ Hikers" width={28} height={28} className="object-cover" /></div>
          <span className="font-display font-bold text-white text-sm">Admin Panel</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10 text-white/70">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 28, stiffness: 220 }} className="fixed inset-y-0 left-0 z-50 w-72">
              <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 z-10 p-2 rounded-lg hover:bg-white/10 text-white/70">
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="lg:hidden h-14" />
    </>
  )
}
