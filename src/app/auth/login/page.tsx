"use client"
import React, { Suspense, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LOGO_URL } from "@/lib/media"
import toast from "react-hot-toast"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error("Fill in all fields"); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message || "Login failed")
    } else {
      toast.success("Welcome back!")
      router.push(redirect)
      router.refresh()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md"
    >
      {/* Mobile logo — uses Image not Mountain icon */}
      <div className="lg:hidden mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <Image src={LOGO_URL} alt="GenZ Hikers" width={32} height={32} className="object-cover" />
          </div>
          <span className="font-display font-bold text-[#173D35] text-lg">GenZ Hikers</span>
        </Link>
      </div>

      <h1 className="font-display font-bold text-3xl text-[#171B19] mb-2">Welcome back</h1>
      <p className="text-[#6b6b5e] text-sm mb-8">Sign in to your GenZ Hikers account.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPass ? "text" : "password"}
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-8 text-[#9c9c8f] hover:text-[#173D35] transition-colors"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs text-[#173D35] hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? "Signing in..." : "Sign In"}
          <LogIn className="w-4 h-4" />
        </Button>
      </form>

      <p className="text-center text-sm text-[#6b6b5e] mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-[#173D35] font-medium hover:underline">
          Join GenZ Hikers
        </Link>
      </p>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F4EF] flex">

      {/* ── Left panel — cinematic mountain photo ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85"
            alt="Mountain hiking"
            fill
            className="object-cover"
            priority
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f1a]/70 via-[#0a1f1a]/30 to-[#0a1f1a]/85" />
        </div>

        {/* Top — Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/25 shadow-lg">
              <Image src={LOGO_URL} alt="GenZ Hikers" width={44} height={44} className="object-cover" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-lg leading-tight">GenZ Hikers</div>
              <div className="text-[10px] text-[#A4AA83] uppercase tracking-widest">Clean &amp; Green</div>
            </div>
          </Link>
        </div>

        {/* Bottom — Quote */}
        <div className="relative z-10">
          <div className="w-8 h-0.5 bg-[#A4AA83] mb-4" />
          <blockquote className="text-white/90 font-display text-2xl sm:text-3xl font-medium leading-snug mb-4">
            &ldquo;The mountains are calling and I must go.&rdquo;
          </blockquote>
          <p className="text-[#A4AA83] text-sm font-medium">— Every GenZ Hiker, every Sunday</p>
          <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#A4AA83] animate-pulse" />
            <span className="text-white/50 text-xs uppercase tracking-wider">Pakistan&apos;s Youth Outdoor Community</span>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-[#F5F4EF]">
        <Suspense
          fallback={
            <div className="w-full max-w-md flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-[#173D35] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
