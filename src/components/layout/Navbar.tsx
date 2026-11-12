"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, User, LogOut, ChevronDown, Bell, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LOGO_URL } from "@/lib/media"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Hikes", href: "/#hikes" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Announcements", href: "/#announcements" },
  { label: "Leadership", href: "/#leadership" },
  { label: "Contact", href: "/#contact" },
]

interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  role: string
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<Profile | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .eq("id", authUser.id)
          .single()
        setUser(data)
      }
    }
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null)
      else loadUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setShowUserMenu(false)
  }

  const isAdmin = user?.role === "super_admin" || user?.role === "admin" || user?.role === "senior_member"

  // Determine if we're on a dark hero section (homepage only, before scroll)
  const isHeroPage = pathname === "/"
  const isDark = isHeroPage && !scrolled

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#173D35]/10 shadow-sm"
            : isHeroPage
            ? "bg-transparent"
            : "bg-white/95 backdrop-blur-md border-b border-[#173D35]/10"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="relative w-9 h-9 rounded-full overflow-hidden">
                <Image
                  src={LOGO_URL}
                  alt="GenZ Hikers"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-[#173D35] text-white font-display font-bold text-sm -z-10">
                  GH
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span
                  className={cn(
                    "font-display font-bold text-base tracking-tight transition-colors",
                    isDark ? "text-white" : "text-[#173D35]"
                  )}
                >
                  GenZ Hikers
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium tracking-wider uppercase transition-colors",
                    isDark ? "text-[#A4AA83]" : "text-[#A4AA83]"
                  )}
                >
                  Clean & Green
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 animated-underline",
                    isDark
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-[#171B19]/70 hover:text-[#173D35] hover:bg-[#173D35]/8"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium",
                      isDark
                        ? "text-white/90 hover:bg-white/10"
                        : "text-[#171B19] hover:bg-[#173D35]/8"
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#173D35] flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.full_name} width={28} height={28} className="object-cover" />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {user.full_name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block max-w-[100px] truncate">
                      {user.full_name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </button>

                  {showUserMenu && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white border border-[#173D35]/10 shadow-xl overflow-hidden z-50">
                        <div className="p-1">
                          <Link href="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-[#171B19] rounded-lg hover:bg-[#173D35]/8 transition-colors">
                            <User className="w-4 h-4" /> My Dashboard
                          </Link>
                          <Link href="/dashboard/notifications" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-[#171B19] rounded-lg hover:bg-[#173D35]/8 transition-colors">
                            <Bell className="w-4 h-4" /> Notifications
                          </Link>
                          {isAdmin && (
                            <Link href="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-[#173D35] font-medium rounded-lg hover:bg-[#173D35]/8 transition-colors">
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <hr className="my-1 border-[#173D35]/10" />
                          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                      isDark
                        ? "text-white/80 hover:text-white hover:bg-white/10"
                        : "text-[#173D35] hover:bg-[#173D35]/8"
                    )}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 text-sm font-medium bg-[#173D35] text-white rounded-lg hover:bg-[#1e5045] transition-all"
                  >
                    Join Us
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                  "lg:hidden p-2 rounded-lg transition-colors",
                  isDark ? "text-white hover:bg-white/10" : "text-[#171B19] hover:bg-[#173D35]/8"
                )}
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-[#173D35]/10 shadow-lg lg:hidden overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-[#171B19] rounded-lg hover:bg-[#173D35]/8 hover:text-[#173D35] transition-colors"
                >
                  {link.label}
                </Link>
              </div>
            ))}
            {!user && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-[#173D35]/10">
                <Link href="/auth/login" onClick={() => setIsOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-[#173D35] border border-[#173D35]/30 rounded-lg hover:bg-[#173D35]/8 transition-colors">Sign In</Link>
                <Link href="/auth/register" onClick={() => setIsOpen(false)} className="flex-1 text-center px-4 py-2.5 text-sm font-medium bg-[#173D35] text-white rounded-lg hover:bg-[#1e5045] transition-colors">Join Us</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for user menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
      )}
    </>
  )
}
