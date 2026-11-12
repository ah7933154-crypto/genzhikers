"use client"
import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mountain, Mail, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error("Enter your email"); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    setLoading(false)
    if (error) { toast.error(error.message) } else { setSent(true) }
  }

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-[#6b6b5e] hover:text-[#173D35] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>

        <div className="w-12 h-12 rounded-xl bg-[#173D35] flex items-center justify-center mb-6">
          {sent ? <Mail className="w-6 h-6 text-white" /> : <Mountain className="w-6 h-6 text-white" />}
        </div>

        {sent ? (
          <>
            <h1 className="font-display font-bold text-2xl text-[#171B19] mb-3">Reset link sent</h1>
            <p className="text-[#6b6b5e] text-sm leading-relaxed">
              Check your email for a password reset link. If you don&apos;t see it, check your spam folder.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display font-bold text-2xl text-[#171B19] mb-2">Forgot password?</h1>
            <p className="text-[#6b6b5e] text-sm mb-8">Enter your email and we&apos;ll send a reset link.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <Input label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  )
}
