"use client"
import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Flag, CheckCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import toast from "react-hot-toast"

const PROBLEM_TYPES = [
  "Bug or technical issue",
  "Inappropriate content",
  "Account problem",
  "Safety concern",
  "Incorrect information",
  "Payment or membership issue",
  "Other",
]

export default function ReportPage() {
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || !description) { toast.error("Please fill in all required fields"); return }
    setLoading(true)

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Insert as a feedback record (type: report)
    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id || null,
      hike_event_id: null,
      rating: null,
      content: `[REPORT - ${type}]\n\n${description}\n\nContact: ${email || user?.email || "anonymous"}`,
      is_approved: false,
    })

    setLoading(false)
    if (error) { toast.error("Failed to submit. Please try again.") }
    else { setDone(true) }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F4EF] pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#6b6b5e] hover:text-[#173D35] mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          {done ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="font-display font-bold text-2xl text-[#171B19] mb-2">Report Submitted</h1>
              <p className="text-[#6b6b5e] text-sm mb-6">Thank you for helping us improve GenZ Hikers. We will review your report and take action if needed.</p>
              <Link href="/" className="text-[#173D35] text-sm hover:underline">Return to home</Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Flag className="w-5 h-5 text-red-600" />
                </div>
                <h1 className="font-display font-bold text-2xl text-[#171B19]">Report a Problem</h1>
              </div>
              <p className="text-[#6b6b5e] text-sm mb-8">Help us fix issues and keep GenZ Hikers safe and enjoyable for everyone.</p>

              <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#173D35]/10 p-6 space-y-5 shadow-sm">
                <div>
                  <label className="block text-sm font-semibold text-[#171B19] mb-2">Problem Type *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROBLEM_TYPES.map((t) => (
                      <label key={t} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                        type === t ? "border-[#173D35] bg-[#173D35]/5 text-[#173D35] font-medium" : "border-gray-200 text-[#6b6b5e] hover:border-gray-300"
                      }`}>
                        <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${type === t ? "border-[#173D35] bg-[#173D35]" : "border-gray-300"}`} />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>

                <Textarea
                  label="Description *"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the problem in detail. Include any steps to reproduce it, screenshots you can describe, or any other relevant information."
                  rows={5}
                />

                <Input
                  label="Your email (optional, if you want a response)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : "Submit Report"}
                </Button>
              </form>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
