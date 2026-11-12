"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, User, Mountain, Bell, CreditCard,
  Shield, AlertTriangle, Award, LogOut, Menu, X, ChevronRight, Footprints
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LOGO_URL } from "@/lib/media"
import toast from "react-hot-toast"

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
  membership_status: string
  completed_hikes_count: number
}

const navItems = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Overview",        color: "text-emerald-400", badge: false },
  { href: "/dashboard/profile",      icon: User,            label: "My Profile",      color: "text-blue-400",    badge: false },
  { href: "/dashboard/hikes",        icon: Mountain,        label: "My Hikes",        color: "text-teal-400",    badge: false },
  { href: "/dashboard/membership",   icon: CreditCard,      label: "Membership Card", color: "text-amber-400",   badge: false },
  { href: "/dashboard/achievements", icon: Award,           label: "Achievements",    color: "text-yellow-400",  badge: false },
  { href: "/dashboard/notifications",icon: Bell,            label: "Notifications",   color: "text-blue-400",    badge: true  },
  { href: "/dashboard/safety",       icon: AlertTriangle,   label: "Safety & SOS",    color: "text-red-400",     badge: false },
]

export default function DashboardSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // Fetch unread notification count + subscribe to real-time updates
  useEffect(() => {
    if (!profile?.id) return

    const fetchCount = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("is_read", false)
      setUnreadCount(count || 0)
    }

    fetchCount()

    // Real-time subscription
    const channel = supabase
      .channel(`notif_count_${profile.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${profile.id}`,
      }, () => fetchCount())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success("Signed out")
    router.push("/")
    router.refresh()
  }

  const isAdmin = profile?.role === "super_admin" || profile?.role === "admin" || profile?.role === "senior_member" || profile?.role === "executive"

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0d2920] via-[#0f2820] to-[#081c14]">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#A4AA83]/30 shadow-lg flex-shrink-0 group-hover:border-[#A4AA83]/60 transition-colors">
            <Image src={LOGO_URL} alt="GenZ Hikers" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">GenZ Hikers</p>
            <p className="text-[10px] text-[#A4AA83]/60 uppercase tracking-wider">Member Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Profile card */}
      <div className="px-4 py-4 border-b border-white/8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#173D35]/60 to-[#0f2820]/80 border border-[#A4AA83]/15 p-3.5">
          {/* Background mountain shape */}
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <polygon points="0,100 50,30 90,60 130,10 170,50 200,20 200,100" fill="white" />
            </svg>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[#A4AA83]/40 flex-shrink-0 shadow-lg">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile?.full_name || ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#A4AA83]/20 flex items-center justify-center text-[#A4AA83] font-bold text-base">
                  {profile?.full_name?.charAt(0) || "?"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white text-sm truncate">{profile?.full_name || "Member"}</p>
              <p className="text-xs text-[#A4AA83]/60 capitalize truncate">{profile?.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="relative flex items-center gap-3 mt-3 pt-3 border-t border-white/8">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${profile?.membership_status === "active" ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-yellow-400"}`} />
              <span className="text-xs text-white/50 capitalize">{profile?.membership_status || "pending"}</span>
            </div>
            <span className="text-white/20">·</span>
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Footprints className="w-3 h-3 text-[#A4AA83]/60" />
              <span className="text-[#A4AA83]/80 font-semibold">{profile?.completed_hikes_count || 0}</span>
              <span>hikes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => {
          const active = pathname === item.href
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative",
                  active
                    ? "bg-[#A4AA83]/12 text-white border border-[#A4AA83]/20"
                    : "text-white/45 hover:bg-white/5 hover:text-white/80"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#A4AA83] rounded-full" />
                )}
                <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all relative",
                  active ? "bg-[#A4AA83]/15" : "bg-white/5 group-hover:bg-white/8"
                )}>
                  <item.icon className={cn("w-3.5 h-3.5", active ? item.color : "text-white/40 group-hover:text-white/70")} />
                  {/* Notification badge on Bell icon */}
                  {item.badge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white leading-none shadow-sm">
                      {unreadCount > 99 ? "99" : unreadCount}
                    </span>
                  )}
                </span>
                <span className="flex-1">{item.label}</span>
                {/* Badge in label area */}
                {item.badge && unreadCount > 0 && !active && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white leading-tight">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 text-[#A4AA83]/50" />}
              </Link>
            </motion.div>
          )
        })}

        {isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A4AA83]/70 hover:bg-[#A4AA83]/10 hover:text-[#A4AA83] transition-all mt-2 border border-[#A4AA83]/15 hover:border-[#A4AA83]/30"
            >
              <span className="w-7 h-7 rounded-lg bg-[#A4AA83]/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-3.5 h-3.5" />
              </span>
              Admin Panel
            </Link>
          </motion.div>
        )}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3 border-t border-white/8">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <span className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <LogOut className="w-3.5 h-3.5" />
          </span>
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d2920] border-b border-white/10 h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden"><Image src={LOGO_URL} alt="GenZ Hikers" width={28} height={28} className="object-cover" /></div>
          <span className="font-display font-bold text-white text-sm">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Notification bell for mobile */}
          <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-white/10 text-white/70">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10 text-white/70">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 w-72"
            >
              <div className="absolute top-3 right-3 z-10">
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="lg:hidden h-14" />
    </>
  )
}
