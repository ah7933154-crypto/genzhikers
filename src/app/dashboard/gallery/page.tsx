"use client"
import React, { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Upload, Image as ImageIcon, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import toast from "react-hot-toast"

interface Album { id: string; title: string }

export default function DashboardGalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState("")
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [profile, setProfile] = useState<{ role: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [{ data: p }, { data: a }] = await Promise.all([
          supabase.from("profiles").select("role").eq("id", user.id).single(),
          supabase.from("gallery_albums").select("id,title").order("created_at", { ascending: false }),
        ])
        setProfile(p)
        setAlbums(a || [])
      }
    }
    load()
  }, [])

  const isAuthorized = profile?.role && ["super_admin", "admin", "organizer", "moderator"].includes(profile.role)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedAlbum) { toast.error("Select an album first"); return }
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split(".").pop()
    const path = `gallery/${selectedAlbum}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage.from("gallery").upload(path, file, { upsert: false })
    if (upErr) { toast.error("Upload failed: " + upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(path)
    const isVideo = file.type.startsWith("video/")

    const { error } = await supabase.from("gallery_media").insert({
      album_id: selectedAlbum,
      url: publicUrl,
      media_type: isVideo ? "video" : "image",
      caption: caption || null,
      uploaded_by: user?.id,
    })

    setUploading(false)
    if (error) toast.error("Failed to save: " + error.message)
    else { toast.success("Photo uploaded!"); setUploaded(true); setCaption(""); }
  }

  if (!isAuthorized) {
    return (
      <div className="space-y-4">
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Gallery Upload</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <ImageIcon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-amber-800">Restricted Access</p>
          <p className="text-xs text-amber-700 mt-1">Only admins, organizers, and moderators can upload gallery media.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Upload to Gallery</h1>
        <p className="text-sm text-[#6b6b5e] mt-1">Add photos from hikes and community events.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#173D35]/10 p-6 space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-[#171B19] mb-1.5">Select Album *</label>
          <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
            <SelectTrigger><SelectValue placeholder="Choose an album" /></SelectTrigger>
            <SelectContent>
              {albums.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Input
          label="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Describe the photo..."
        />

        <div
          className="border-2 border-dashed border-[#173D35]/20 rounded-xl p-8 text-center cursor-pointer hover:border-[#173D35]/40 hover:bg-[#173D35]/3 transition-all"
          onClick={() => fileRef.current?.click()}
        >
          {uploaded ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-sm font-medium text-green-700">Uploaded successfully!</p>
              <button className="text-xs text-[#173D35] hover:underline" onClick={(e) => { e.stopPropagation(); setUploaded(false) }}>Upload another</button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#9c9c8f]">
              <Upload className="w-8 h-8" />
              <p className="text-sm font-medium">{uploading ? "Uploading..." : "Click to upload photo or video"}</p>
              <p className="text-xs">PNG, JPG, MP4 up to 10MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </div>
    </div>
  )
}
