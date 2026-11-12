"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Edit, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"

interface Authority {
  id: string
  name: string
  designation: string
  department: string | null
  city: string | null
  bio: string | null
  photo_url: string | null
  instagram_handle: string | null
  is_founding_member: boolean
  is_active: boolean
  sort_order: number
}

export default function AdminAuthoritiesPage() {
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Authority | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "", designation: "", department: "", city: "",
    bio: "", photo_url: "", instagram_handle: "",
    is_founding_member: false, is_active: true, sort_order: 0,
  })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from("authorities").select("*").order("sort_order", { ascending: true })
    setAuthorities(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const openNew = () => {
    setEditing(null)
    setForm({ name: "", designation: "", department: "", city: "", bio: "", photo_url: "", instagram_handle: "", is_founding_member: false, is_active: true, sort_order: authorities.length + 1 })
    setShowForm(true)
  }

  const openEdit = (auth: Authority) => {
    setEditing(auth)
    setForm({
      name: auth.name, designation: auth.designation, department: auth.department || "",
      city: auth.city || "", bio: auth.bio || "", photo_url: auth.photo_url || "",
      instagram_handle: auth.instagram_handle || "", is_founding_member: auth.is_founding_member,
      is_active: auth.is_active, sort_order: auth.sort_order,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.designation) { toast.error("Name and designation required"); return }
    setSaving(true)
    const payload = {
      name: form.name, designation: form.designation,
      department: form.department || null, city: form.city || null,
      bio: form.bio || null, photo_url: form.photo_url || null,
      instagram_handle: form.instagram_handle || null,
      is_founding_member: form.is_founding_member,
      is_active: form.is_active, sort_order: parseInt(String(form.sort_order)) || 0,
    }
    const { error } = editing
      ? await supabase.from("authorities").update(payload).eq("id", editing.id)
      : await supabase.from("authorities").insert(payload)
    setSaving(false)
    if (error) toast.error("Failed: " + error.message)
    else { toast.success(editing ? "Updated!" : "Added!"); setShowForm(false); load() }
  }

  const deleteAuth = async (id: string) => {
    if (!confirm("Remove this authority?")) return
    await supabase.from("authorities").delete().eq("id", id)
    toast.success("Removed"); load()
  }

  const toggleActive = async (auth: Authority) => {
    await supabase.from("authorities").update({ is_active: !auth.is_active }).eq("id", auth.id)
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Leadership & Authorities</h1>
          <p className="text-sm text-gray-500">Manage community leadership profiles</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-display font-semibold text-[#171B19]">{editing ? "Edit" : "Add"} Authority</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name *" value={form.name} onChange={set("name")} />
            <Input label="Designation *" value={form.designation} onChange={set("designation")} placeholder="Head / Founder" />
            <Input label="Department" value={form.department} onChange={set("department")} placeholder="Leadership, Media..." />
            <Input label="City" value={form.city} onChange={set("city")} placeholder="Gilgit" />
            <Input label="Instagram Handle" value={form.instagram_handle} onChange={set("instagram_handle")} placeholder="username (no @)" />
            <Input label="Photo URL" value={form.photo_url} onChange={set("photo_url")} placeholder="https://..." />
            <Input label="Sort Order" type="number" value={String(form.sort_order)} onChange={set("sort_order")} />
          </div>
          <Textarea label="Bio" value={form.bio} onChange={set("bio")} placeholder="Short bio..." rows={3} />
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_founding_member} onChange={(e) => setForm((f) => ({ ...f, is_founding_member: e.target.checked }))} />
              Founding Member
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              Show on Website
            </label>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white rounded-xl animate-pulse border border-gray-200" />) :
          authorities.map((auth) => (
            <div key={auth.id} className={`bg-white rounded-xl border p-4 ${!auth.is_active ? "opacity-60 border-dashed" : "border-gray-200"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#173D35] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {auth.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#171B19] text-sm">{auth.name}</p>
                    <p className="text-xs text-[#173D35]">{auth.designation}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(auth)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteAuth(auth.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {auth.city && <p className="text-xs text-gray-400">{auth.city}</p>}
              {auth.bio && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{auth.bio}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs font-medium ${auth.is_active ? "text-green-600" : "text-gray-400"}`}>
                  {auth.is_active ? "Visible" : "Hidden"}
                </span>
                <button onClick={() => toggleActive(auth)} className="text-xs text-[#173D35] hover:underline">
                  {auth.is_active ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
