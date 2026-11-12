"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, Pin, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import toast from "react-hot-toast"

interface Announcement {
  id: string
  title: string
  content: string
  category: string
  is_urgent: boolean
  is_pinned: boolean
  is_published: boolean
  published_at: string | null
  created_at: string
}

const categories = [
  { value: "upcoming_hikes", label: "Upcoming Hikes" },
  { value: "important_notices", label: "Important Notices" },
  { value: "elections", label: "Elections" },
  { value: "membership", label: "Membership" },
  { value: "events", label: "Events" },
  { value: "general", label: "General" },
]

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ title: "", content: "", category: "general", is_urgent: false, is_pinned: false })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ title: "", content: "", category: "general", is_urgent: false, is_pinned: false })
    setShowForm(true)
  }

  const openEdit = (ann: Announcement) => {
    setEditing(ann)
    setForm({ title: ann.title, content: ann.content, category: ann.category, is_urgent: ann.is_urgent, is_pinned: ann.is_pinned })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.content) { toast.error("Fill title and content"); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      ...form,
      is_published: true,
      published_at: new Date().toISOString(),
      created_by: user?.id,
    }
    const { error } = editing
      ? await supabase.from("announcements").update(payload).eq("id", editing.id)
      : await supabase.from("announcements").insert(payload)
    setSaving(false)
    if (error) toast.error("Failed: " + error.message)
    else { toast.success(editing ? "Updated!" : "Published!"); setShowForm(false); load() }
  }

  const togglePublish = async (ann: Announcement) => {
    await supabase.from("announcements").update({
      is_published: !ann.is_published,
      published_at: !ann.is_published ? new Date().toISOString() : null,
    }).eq("id", ann.id)
    load()
  }

  const deleteAnn = async (id: string) => {
    if (!confirm("Delete this announcement?")) return
    await supabase.from("announcements").delete().eq("id", id)
    toast.success("Deleted"); load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Announcements</h1>
          <p className="text-sm text-gray-500">Publish community announcements</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-display font-semibold text-[#171B19]">{editing ? "Edit" : "New"} Announcement</h2>
          <Input label="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Textarea label="Content *" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
          <div>
            <label className="block text-sm font-medium text-[#171B19] mb-1.5">Category</label>
            <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_urgent} onChange={(e) => setForm((f) => ({ ...f, is_urgent: e.target.checked }))} className="rounded" />
              Mark as Urgent
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_pinned} onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))} className="rounded" />
              Pin to Top
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Publish"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-200" />)
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No announcements yet.</div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className={`bg-white rounded-xl border p-4 ${ann.is_urgent ? "border-red-200" : "border-gray-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge variant={ann.category === "important_notices" || ann.is_urgent ? "destructive" : "secondary"} className="text-xs capitalize">
                      {categories.find((c) => c.value === ann.category)?.label}
                    </Badge>
                    {ann.is_urgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                    {ann.is_pinned && <Badge variant="info" className="text-xs">Pinned</Badge>}
                    {!ann.is_published && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                  </div>
                  <h3 className="font-semibold text-[#171B19] text-sm">{ann.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ann.content}</p>
                  {ann.published_at && <p className="text-xs text-gray-400 mt-1">{formatDate(ann.published_at)}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => togglePublish(ann)} className={`p-1.5 rounded-lg transition-colors ${ann.is_published ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`} title={ann.is_published ? "Unpublish" : "Publish"}>
                    {ann.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(ann)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteAnn(ann.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
