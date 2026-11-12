"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LOGO_URL } from "@/lib/media"
import Image from "next/image"
import toast from "react-hot-toast"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  // Supabase sends the user to this page with a session token in the URL hash
  // The client auto-picks it up — we just need to call updateUser
  useEffect(() => {
    // Listen for auth state — if the recovery token is in the URL hash,
    // Supabase JS client processes it automatically and sets the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // Session is now active — user can set a new password
        toast("You can now set a new password.", { icon: "🔑" })
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) { toast.error("Enter a new password"); return }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return }
    if (password !== confirm) { toast.error("Passwords do not match"); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message || "Failed to update password")
    } else {
      setDone(true)
      toast.success("Password updated successfully!")
      setTimeout(() => router.push("/auth/login"), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#173D35]/20">
            <Image src={LOGO_URL} alt="GenZ Hikers" width={40} height={40} className="object-cover" />
          </div>
          <div>
            <p className="font-display font-bold text-[#173D35] text-sm">GenZ Hikers</p>
            <p className="text-xs text-[#9c9c8f]">Password Reset</p>
          </div>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="font-display font-bold text-2xl text-[#171B19] mb-2">Password Updated!</h1>
            <p className="text-[#6b6b5e] text-sm mb-4">Your password has been changed. Redirecting to login...</p>
            <Link href="/auth/login" className="text-[#173D35] text-sm font-medium hover:underline">
              Go to login now
            </Link>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-[#173D35] flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl text-[#171B19] mb-2">Set New Password</h1>
            <p className="text-[#6b6b5e] text-sm mb-8">Choose a strong password for your account.</p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-8 text-[#9c9c8f] hover:text-[#173D35] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input
                label="Confirm New Password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
              />

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= i*3 ? password.length >= 12 ? "bg-green-500" : "bg-amber-400" : "bg-gray-200"
                      }`} />
                    ))}
                  </div>
                  <p className="text-xs text-[#9c9c8f]">
                    {password.length < 8 ? "Too short" : password.length < 12 ? "Good" : "Strong"}
                  </p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                <Lock className="w-4 h-4" />
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
