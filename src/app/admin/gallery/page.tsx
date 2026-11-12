"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import toast from "react-hot-toast"

interface Album {
  id: string
  title: string
  event_date: string | null
  location: string | null
  cover_image_url: string | null
}

interface MediaItem {
  id: string
  album_id: string
  url: string
  caption: string | null
  media_type: string
}

export default function AdminGalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState("all")
  const [showAlbumForm, setShowAlbumForm] = useState(false)
  const [showMediaForm, setShowMediaForm] = useState(false)
  const [albumForm, setAlbumForm] = useState({ title: "", event_date: "", location: "" })
  const [mediaForm, setMediaForm] = useState({ url: "", caption: "", photographer_name: "", album_id: "", media_type: "image" })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const [albumRes, mediaRes] = await Promise.all([
      supabase.from("gallery_albums").select("id,title,event_date,location,cover_image_url").order("created_at", { ascending: false }),
      supabase.from("gallery_media").select("id,album_id,url,caption,media_type").order("created_at", { ascending: false }).limit(50),
    ])
    setAlbums(albumRes.data || [])
    setMediaItems(mediaRes.data || [])
  }

  useEffect(() => { load() }, [])

  const createAlbum = async () => {
    if (!albumForm.title) { toast.error("Album title required"); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from("gallery_albums").insert({
      ...albumForm, event_date: albumForm.event_date || null, location: albumForm.location || null, created_by: user?.id,
    })
    setSaving(false)
    if (error) toast.error("Failed")
    else { toast.success("Album created"); setShowAlbumForm(false); setAlbumForm({ title: "", event_date: "", location: "" }); load() }
  }

  const addMedia = async () => {
    if (!mediaForm.url || !mediaForm.album_id) { toast.error("URL and album required"); return }
    setSaving(true)
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mediaForm),
    })
    const result = await res.json()
    setSaving(false)
    if (!res.ok) toast.error(result.error || "Failed to add")
    else { toast.success("Media added to gallery!"); setShowMediaForm(false); setMediaForm({ url: "", caption: "", photographer_name: "", album_id: "", media_type: "image" }); load() }
  }

  const deleteMedia = async (id: string) => {
    if (!confirm("Delete this media from gallery?")) return
    const res = await fetch("/api/admin/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    const result = await res.json()
    if (!res.ok) toast.error(result.error || "Failed to delete")
    else { toast.success("Deleted"); load() }
  }

  const filtered = selectedAlbum === "all" ? mediaItems : mediaItems.filter((m) => m.album_id === selectedAlbum)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Gallery</h1>
          <p className="text-sm text-gray-500">{albums.length} albums · {mediaItems.length} items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAlbumForm(true)}>
            <Plus className="w-4 h-4" /> Album
          </Button>
          <Button size="sm" onClick={() => setShowMediaForm(true)}>
            <Plus className="w-4 h-4" /> Add Media
          </Button>
        </div>
      </div>

      {showAlbumForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-[#171B19]">Create Album</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Album Title *" value={albumForm.title} onChange={(e) => setAlbumForm((f) => ({ ...f, title: e.target.value }))} />
            <Input label="Date" type="date" value={albumForm.event_date} onChange={(e) => setAlbumForm((f) => ({ ...f, event_date: e.target.value }))} />
            <Input label="Location" value={albumForm.location} onChange={(e) => setAlbumForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={createAlbum} disabled={saving} size="sm">Create</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAlbumForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {showMediaForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <h2 className="font-semibold text-[#171B19]">Add Media via URL</h2>
          <p className="text-xs text-gray-400">Paste a Cloudinary URL, Google Drive direct link, or any public image/video URL.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input label="Image/Video URL *" value={mediaForm.url} onChange={(e) => setMediaForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://res.cloudinary.com/... or https://drive.google.com/..." />
              {mediaForm.url && mediaForm.media_type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaForm.url} alt="preview" className="mt-2 h-24 rounded-lg object-cover border border-gray-200" onError={(e) => (e.currentTarget.style.display="none")} />
              )}
            </div>
            <Input label="Caption" value={mediaForm.caption} onChange={(e) => setMediaForm((f) => ({ ...f, caption: e.target.value }))} placeholder="Describe this photo..." />
            <Input label="Photographer Name" value={mediaForm.photographer_name} onChange={(e) => setMediaForm((f) => ({ ...f, photographer_name: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-[#171B19] mb-1.5">Album *</label>
              <Select value={mediaForm.album_id} onValueChange={(v) => setMediaForm((f) => ({ ...f, album_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select album" /></SelectTrigger>
                <SelectContent>
                  {albums.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#171B19] mb-1.5">Type</label>
              <Select value={mediaForm.media_type} onValueChange={(v) => setMediaForm((f) => ({ ...f, media_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addMedia} disabled={saving} size="sm">Add to Gallery</Button>
            <Button variant="outline" size="sm" onClick={() => setShowMediaForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setSelectedAlbum("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedAlbum === "all" ? "bg-[#173D35] text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
          All ({mediaItems.length})
        </button>
        {albums.map((album) => (
          <button key={album.id} onClick={() => setSelectedAlbum(album.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedAlbum === album.id ? "bg-[#173D35] text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
            {album.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((item) => (
          <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.caption || ""} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <button onClick={() => deleteMedia(item.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-red-500 text-white transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs line-clamp-1">{item.caption}</p>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-12 text-gray-400">
            <ImageIcon className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No media yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
