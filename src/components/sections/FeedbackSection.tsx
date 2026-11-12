"use client"
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Star, MessageSquare, Clock, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { isFeedbackWindowOpen, getNextFeedbackWindow } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface FeedbackItem {
  id: string
  rating: number | null
  content: string
  created_at: string
  user: { full_name: string; avatar_url: string | null } | null
  event: { title: string } | null
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const tick = () => {
      const diff = targetDate.getTime() - Date.now()
      if (diff <= 0) return
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div className="flex items-center gap-3">
      {[
        { v: timeLeft.days, l: "Days" },
        { v: timeLeft.hours, l: "Hours" },
        { v: timeLeft.minutes, l: "Mins" },
        { v: timeLeft.seconds, l: "Secs" },
      ].map(({ v, l }) => (
        <div key={l} className="text-center">
          <div className="w-14 h-14 rounded-xl bg-[#173D35] flex items-center justify-center font-display font-bold text-xl text-white">
            {String(v).padStart(2, "0")}
          </div>
          <p className="text-xs text-[#9c9c8f] mt-1">{l}</p>
        </div>
      ))}
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className="w-7 h-7 transition-colors"
            fill={s <= (hover || value) ? "#A4AA83" : "none"}
            color={s <= (hover || value) ? "#A4AA83" : "#d1d5db"}
          />
        </button>
      ))}
    </div>
  )
}

export default function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [nextWindow, setNextWindow] = useState<Date>(new Date())
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setIsOpen(isFeedbackWindowOpen())
    setNextWindow(getNextFeedbackWindow())

    const id = setInterval(() => {
      setIsOpen(isFeedbackWindowOpen())
      setNextWindow(getNextFeedbackWindow())
    }, 60000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u ? { id: u.id } : null)

      const { data } = await supabase
        .from("feedback")
        .select("id,rating,content,created_at,user:profiles(full_name,avatar_url),event:hike_events(title)")
        .eq("is_approved", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(6)
      setFeedbacks((data as unknown as FeedbackItem[]) || [])
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast.error("Please sign in to leave feedback"); return }
    if (!isOpen) { toast.error("Feedback window is closed. Come back on Sunday after 4 PM PKT"); return }
    if (!content.trim()) { toast.error("Please write something"); return }

    setSubmitting(true)
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      rating: rating || null,
      content: content.trim(),
      category: "general",
    })
    setSubmitting(false)

    if (error) {
      toast.error("Could not submit feedback")
    } else {
      toast.success("Thank you for your feedback!")
      setContent("")
      setRating(0)
    }
  }

  return (
    <section id="feedback" className="section-padding bg-[#F5F4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Form */}
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block"
            >
              Your Voice
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="font-display font-bold text-4xl text-[#171B19] leading-tight mb-4"
            >
              Share Your
              <span className="text-[#173D35]"> Experience</span>
            </motion.h2>
            <p className="text-[#6b6b5e] text-sm leading-relaxed mb-8">
              Feedback helps us improve every hike. Share your honest experience every
              Sunday after 4:00 PM PKT.
            </p>

            {isOpen ? (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-[#171B19] mb-2">
                    Rate this hike
                  </label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <Textarea
                  label="Your feedback"
                  placeholder="How was the hike? What did you enjoy? What can be improved?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                />
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Submit Feedback"}
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-[#173D35]/10 p-8 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[#173D35]/8 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-[#173D35]" />
                </div>
                <h3 className="font-display font-semibold text-[#171B19] text-lg mb-2">
                  Feedback window is closed
                </h3>
                <p className="text-sm text-[#6b6b5e] mb-6">
                  Feedback is only accepted on Sundays after 4:00 PM Pakistan Standard Time.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-[#9c9c8f] mb-5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Opens in</span>
                </div>
                <CountdownTimer targetDate={nextWindow} />
              </motion.div>
            )}
          </div>

          {/* Right: Featured feedback */}
          <div>
            <h3 className="font-display font-semibold text-xl text-[#171B19] mb-6">
              What members say
            </h3>
            {feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <MessageSquare className="w-8 h-8 text-[#A4AA83]/40 mb-3" />
                <p className="text-[#6b6b5e] text-sm">No featured feedback yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((fb, i) => (
                  <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="bg-white rounded-xl border border-[#173D35]/10 p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#173D35] flex items-center justify-center text-white text-xs font-bold">
                          {fb.user?.full_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#171B19]">
                            {fb.user?.full_name || "Anonymous"}
                          </p>
                          {fb.event && (
                            <p className="text-xs text-[#9c9c8f]">{fb.event.title}</p>
                          )}
                        </div>
                      </div>
                      {fb.rating && (
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, s) => (
                            <Star
                              key={s}
                              className="w-3.5 h-3.5"
                              fill={s < fb.rating! ? "#A4AA83" : "none"}
                              color={s < fb.rating! ? "#A4AA83" : "#d1d5db"}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-[#6b6b5e] leading-relaxed line-clamp-3">
                      &ldquo;{fb.content}&rdquo;
                    </p>
                    <p className="text-xs text-[#9c9c8f] mt-2">{formatDate(fb.created_at)}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
