"use client"
import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mountain, Eye, EyeOff, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "", city: "" })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.fullName || !form.email || !form.password) { toast.error("Fill in all required fields"); return }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return }
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) {
      toast.error(error.message || "Registration failed")
    } else {
      // Update city in profile
      if (form.city) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from("profiles").update({ city: form.city }).eq("id", user.id)
        }
      }
      toast.success("Account created! Check your email to confirm.")
      router.push("/auth/verify-email")
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#171B19] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 600 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <polygon points="0,800 300,200 600,800" fill="white" />
            <polygon points="100,800 400,300 650,800" fill="white" opacity="0.5" />
          </svg>
        </div>
        <div className="relative">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg">GenZ Hikers</div>
              <div className="text-[10px] text-[#A4AA83] uppercase tracking-widest">Clean & Green</div>
            </div>
          </Link>
        </div>
        <div className="relative space-y-4">
          {["Explore Pakistan's most beautiful trails", "Join a community of like-minded adventurers", "Track your hikes and earn achievements", "Vote in community elections"].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#A4AA83]" />
              <span className="text-white/70 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md py-8"
        >
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="w-6 h-6 text-[#173D35]" />
              <span className="font-display font-bold text-[#173D35] text-lg">GenZ Hikers</span>
            </Link>
          </div>

          <h1 className="font-display font-bold text-3xl text-[#171B19] mb-2">Join GenZ Hikers</h1>
          <p className="text-[#6b6b5e] text-sm mb-8">Create your account and start your adventure.</p>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input label="Full Name *" type="text" placeholder="Your full name" value={form.fullName} onChange={set("fullName")} required />
            <Input label="Email Address *" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
            <Input label="City" type="text" placeholder="Your city (e.g. Lahore)" value={form.city} onChange={set("city")} />
            <div className="relative">
              <Input
                label="Password *"
                type={showPass ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={set("password")}
                hint="Minimum 8 characters"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-8 text-[#9c9c8f] hover:text-[#173D35] transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Input
              label="Confirm Password *"
              type={showPass ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={set("confirm")}
              required
            />
            <p className="text-xs text-[#9c9c8f] leading-relaxed">
              By creating an account, you agree to follow GenZ Hikers community guidelines and hike safely.
            </p>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating Account..." : "Create Account"}
              <UserPlus className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-[#6b6b5e] mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#173D35] font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
