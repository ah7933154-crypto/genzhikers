"use client"
import React, { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Camera, Save, Shield, Upload, Loader2, Award } from "lucide-react"
import toast from "react-hot-toast"
import { ROLES, type Role } from "@/lib/utils"

interface Profile {
  id: string
  full_name: string
  username: string | null
  email: string
  phone: string | null
  city: string | null
  bio: string | null
  avatar_url: string | null
  role: string
  executive_designation: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(data)
      setAvatarPreview(data?.avatar_url || null)
    }
    load()
  }, [])

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setProfile((p) => p ? { ...p, [k]: e.target.value } : p)

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      username: profile.username || null,
      phone: profile.phone || null,
      city: profile.city || null,
      bio: profile.bio || null,
      emergency_contact_name: profile.emergency_contact_name || null,
      emergency_contact_phone: profile.emergency_contact_phone || null,
      emergency_contact_relation: profile.emergency_contact_relation || null,
    }).eq("id", profile.id)
    setSaving(false)
    if (error) toast.error("Failed to save: " + error.message)
    else toast.success("Profile updated!")
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate on client first
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3MB")
      return
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      toast.error("Use JPG, PNG, WebP, or GIF")
      return
    }

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        // Revert preview on failure
        setAvatarPreview(profile.avatar_url)
        toast.error(result.error || "Upload failed")
      } else {
        setProfile((p) => p ? { ...p, avatar_url: result.url } : p)
        setAvatarPreview(result.url)
        toast.success("Profile photo updated!")
      }
    } catch {
      setAvatarPreview(profile.avatar_url)
      toast.error("Upload failed. Check your internet connection.")
    } finally {
      setUploading(false)
      // Clean up object URL
      URL.revokeObjectURL(objectUrl)
    }
  }

  if (!profile) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-[#173D35]/10" />
      ))}
    </div>
  )

  const displayRole = ROLES[profile.role as Role] || profile.role?.replace(/_/g, " ")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">My Profile</h1>
        <p className="text-sm text-[#6b6b5e] mt-1">Manage your GenZ Hikers profile information.</p>
      </div>

      {/* ── Avatar ── */}
      <div className="bg-white rounded-xl border border-[#173D35]/10 p-6">
        <h2 className="font-display font-semibold text-[#171B19] mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          {/* Avatar circle */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-[#173D35] flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{profile.full_name?.charAt(0)?.toUpperCase() || "?"}</span>
              )}
            </div>
            {/* Upload button overlay */}
            <button
              onClick={() => !uploading && fileRef.current?.click()}
              disabled={uploading}
              className={`absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#173D35] hover:bg-[#1e5045] cursor-pointer"
              }`}
              title="Change photo"
            >
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                : <Camera className="w-3.5 h-3.5 text-white" />
              }
            </button>
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-[#171B19]">{profile.full_name}</p>
            {profile.executive_designation ? (
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                  <Award className="w-3 h-3" /> {profile.executive_designation}
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#9c9c8f] mt-0.5 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {displayRole}
              </p>
            )}
            <div className="mt-3 flex flex-col gap-1.5">
              <button
                onClick={() => !uploading && fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 text-xs text-[#173D35] hover:text-[#1e5045] transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Uploading..." : "Upload new photo"}
              </button>
              <span className="text-xs text-[#9c9c8f]">JPG, PNG, WebP — max 3MB</span>
            </div>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleAvatarChange}
          disabled={uploading}
        />


      </div>

      {/* ── Basic Info ── */}
      <div className="bg-white rounded-xl border border-[#173D35]/10 p-6 space-y-4">
        <h2 className="font-display font-semibold text-[#171B19]">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={profile.full_name || ""}
            onChange={set("full_name")}
            placeholder="Your full name"
          />
          <Input
            label="Username"
            value={profile.username || ""}
            onChange={set("username")}
            placeholder="@yourhandle"
          />
          <Input
            label="Email"
            value={profile.email || ""}
            disabled
            hint="Email cannot be changed here"
          />
          <Input
            label="Phone Number"
            value={profile.phone || ""}
            onChange={set("phone")}
            placeholder="+92 300 1234567"
            type="tel"
          />
          <div className="sm:col-span-2">
            <Input
              label="City"
              value={profile.city || ""}
              onChange={set("city")}
              placeholder="e.g. Lahore, Gilgit, Karachi"
            />
          </div>
        </div>
        <Textarea
          label="Bio"
          value={profile.bio || ""}
          onChange={set("bio")}
          placeholder="Tell the community a bit about yourself and your love for hiking..."
          rows={3}
        />
      </div>

      {/* ── Emergency Contacts ── */}
      <div className="bg-white rounded-xl border border-[#173D35]/10 p-6 space-y-4">
        <div>
          <h2 className="font-display font-semibold text-[#171B19]">Emergency Contacts</h2>
          <p className="text-xs text-[#6b6b5e] mt-1">
            Only visible to event organizers in case of an emergency on a hike.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Contact Name"
            value={profile.emergency_contact_name || ""}
            onChange={set("emergency_contact_name")}
            placeholder="Parent / Guardian"
          />
          <Input
            label="Contact Phone"
            value={profile.emergency_contact_phone || ""}
            onChange={set("emergency_contact_phone")}
            type="tel"
            placeholder="+92 300 0000000"
          />
          <Input
            label="Relationship"
            value={profile.emergency_contact_relation || ""}
            onChange={set("emergency_contact_relation")}
            placeholder="Mother, Father, Sibling..."
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
