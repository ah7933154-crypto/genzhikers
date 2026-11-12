"use client"
import React, { useState, useEffect } from "react"
import { Lock, Eye, EyeOff, Shield } from "lucide-react"
import { LOGO_URL } from "@/lib/media"
import Image from "next/image"

const ADMIN_PASSWORD = "GenZHikers@2026#Admin"
const SESSION_KEY = "genz_admin_verified"

export default function AdminPasswordGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check session storage so they don't re-enter every page navigation
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      setVerified(true)
    }
    setChecking(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1")
      setVerified(true)
      setError("")
    } else {
      setError("Incorrect password. Try again.")
      setPassword("")
    }
  }

  if (checking) return null
  if (verified) return <>{children}</>

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f1a] via-[#173D35] to-[#0a1f1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#A4AA83]/30 mx-auto mb-4">
            <Image src={LOGO_URL} alt="GenZ Hikers" width={64} height={64} className="object-cover" />
          </div>
          <h1 className="font-display font-bold text-white text-2xl">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-1">Enter the admin password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 justify-center mb-2">
            <Shield className="w-4 h-4 text-[#A4AA83]" />
            <span className="text-[#A4AA83] text-xs font-semibold uppercase tracking-widest">Secure Access</span>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full bg-white/10 border border-white/20 rounded-xl px-10 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#A4AA83]/50 focus:bg-white/15 transition-all"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#A4AA83] hover:bg-[#b4ba93] text-[#0a1f1a] font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Enter Admin Panel
          </button>
        </form>

        <p className="text-white/20 text-xs text-center mt-4">GenZ Hikers · Restricted Access</p>
      </div>
    </div>
  )
}
