"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Star, MessageSquare, Trash2, Eye } from "lucide-react"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface Feedback {
  id: string
  rating: number | null
  content: string
  category: string
  is_approved: boolean
  is_featured: boolean
  created_at: string
  admin_response: string | null
  profile: { full_name: string } | null
  event: { title: string } | null
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"pending" | "approved">("pending")
  const [responding, setResponding] = useState<string | null>(null)
  const [response, setResponse] = useState("")
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from("feedback")
      .select("id,rating,content,category,is_approved,is_featured,created_at,admin_response,profile:profiles(full_name),event:hike_events(title)")
      .eq("is_approved", tab === "approved")
      .order("created_at", { ascending: false })
    setFeedbacks((data as unknown as Feedback[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tab])

  const approve = async (id: string) => {
    await supabase.from("feedback").update({ is_approved: true }).eq("id", id)
    toast.success("Approved"); load()
  }

  const feature = async (id: string, is_featured: boolean) => {
    await supabase.from("feedback").update({ is_featured }).eq("id", id)
    toast.success(is_featured ? "Marked as featured" : "Removed from featured"); load()
  }

  const deleteFeedback = async (id: string) => {
    if (!confirm("Delete this feedback?")) return
    await supabase.from("feedback").delete().eq("id", id)
    toast.success("Deleted"); load()
  }

  const submitResponse = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("feedback").update({
      admin_response: response,
      responded_by: user?.id,
      responded_at: new Date().toISOString(),
    }).eq("id", id)
    setResponding(null)
    setResponse("")
    toast.success("Response saved"); load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Feedback</h1>
        <p className="text-sm text-gray-500">Review and moderate community feedback</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["pending", "approved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? "bg-[#173D35] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-200" />)
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No {tab} feedback
          </div>
        ) : feedbacks.map((fb) => (
          <div key={fb.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-[#171B19]">
                    {(fb.profile as { full_name: string } | null)?.full_name || "Anonymous"}
                  </span>
                  {fb.event && <span className="text-xs text-gray-400">· {(fb.event as { title: string }).title}</span>}
                  {fb.rating && (
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3" fill={i < fb.rating! ? "#A4AA83" : "none"} color={i < fb.rating! ? "#A4AA83" : "#d1d5db"} />
                      ))}
                    </div>
                  )}
                  {fb.is_featured && <span className="text-xs bg-[#A4AA83]/20 text-[#5a5f44] px-2 py-0.5 rounded-full">Featured</span>}
                </div>
                <p className="text-sm text-[#6b6b5e] leading-relaxed">{fb.content}</p>
                {fb.admin_response && (
                  <div className="mt-2 p-2.5 bg-[#173D35]/5 rounded-lg border-l-2 border-[#173D35]">
                    <p className="text-xs font-medium text-[#173D35] mb-0.5">Admin response:</p>
                    <p className="text-xs text-[#6b6b5e]">{fb.admin_response}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1.5">{formatDate(fb.created_at)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!fb.is_approved && (
                  <button onClick={() => approve(fb.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600" title="Approve">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                {fb.is_approved && (
                  <button onClick={() => feature(fb.id, !fb.is_featured)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Toggle featured">
                    <Star className="w-4 h-4" fill={fb.is_featured ? "currentColor" : "none"} />
                  </button>
                )}
                <button onClick={() => { setResponding(fb.id); setResponse(fb.admin_response || "") }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Respond">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => deleteFeedback(fb.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {responding === fb.id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Write admin response..."
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#173D35]/20"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => submitResponse(fb.id)} className="px-3 py-1.5 bg-[#173D35] text-white text-xs rounded-lg">Save</button>
                  <button onClick={() => setResponding(null)} className="px-3 py-1.5 border border-gray-200 text-xs rounded-lg">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
