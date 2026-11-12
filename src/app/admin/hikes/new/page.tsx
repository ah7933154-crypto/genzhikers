"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function NewHikePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "", destination: "", starting_point: "", event_date: "",
    meeting_time: "06:00", estimated_return_time: "18:00",
    difficulty: "moderate", distance_km: "", elevation_gain_m: "",
    max_participants: "30", registration_fee: "0",
    description: "", safety_instructions: "",
    required_equipment: "", organizer_name: "", organizer_contact: "",
    cancellation_policy: "", status: "draft",
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const setSelect = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title || !form.destination || !form.event_date || !form.starting_point) {
      toast.error("Fill in all required fields"); return
    }
    setSaving(true)

    const slug = slugify(form.title) + "-" + Date.now().toString().slice(-6)

    // Safe number parsing with fallbacks
    const maxParticipants = parseInt(form.max_participants) || 30
    const registrationFee = parseFloat(form.registration_fee) || 0
    const distanceKm = form.distance_km ? (parseFloat(form.distance_km) || null) : null
    const elevationGain = form.elevation_gain_m ? (parseInt(form.elevation_gain_m) || null) : null

    const payload = {
      title: form.title,
      slug,
      destination: form.destination,
      starting_point: form.starting_point,
      event_date: form.event_date,
      meeting_time: form.meeting_time,
      estimated_return_time: form.estimated_return_time || null,
      difficulty: form.difficulty,
      distance_km: distanceKm,
      elevation_gain_m: elevationGain,
      max_participants: maxParticipants,
      registration_fee: registrationFee,
      description: form.description || null,
      safety_instructions: form.safety_instructions || null,
      required_equipment: form.required_equipment
        ? form.required_equipment.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
      organizer_name: form.organizer_name || null,
      organizer_contact: form.organizer_contact || null,
      cancellation_policy: form.cancellation_policy || null,
      status: form.status,
    }

    // Use API route to bypass RLS
    const res = await fetch("/api/admin/hikes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok) {
      toast.error("Failed: " + (result.error || "Unknown error"))
    } else {
      toast.success("Hike created!")
      router.push("/admin/hikes")
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/hikes" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-[#171B19]">Create New Hike</h1>
          <p className="text-sm text-gray-500">Add a new hiking event</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h2 className="font-display font-semibold text-[#171B19]">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Event Title *" value={form.title} onChange={set("title")} placeholder="Sunday Hike to Margalla Hills" />
          </div>
          <Input label="Destination *" value={form.destination} onChange={set("destination")} placeholder="Margalla Hills, Islamabad" />
          <Input label="Starting Point *" value={form.starting_point} onChange={set("starting_point")} placeholder="Trail 3 Entrance, F-6" />
          <Input label="Event Date *" type="date" value={form.event_date} onChange={set("event_date")} />
          <div>
            <label className="block text-sm font-medium text-[#171B19] mb-1.5">Difficulty *</label>
            <Select value={form.difficulty} onValueChange={setSelect("difficulty")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="difficult">Difficult</SelectItem>
                <SelectItem value="extreme">Extreme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input label="Meeting Time" type="time" value={form.meeting_time} onChange={set("meeting_time")} />
          <Input label="Estimated Return" type="time" value={form.estimated_return_time} onChange={set("estimated_return_time")} />
          <Input label="Distance (km)" type="number" value={form.distance_km} onChange={set("distance_km")} placeholder="12" />
          <Input label="Elevation Gain (m)" type="number" value={form.elevation_gain_m} onChange={set("elevation_gain_m")} placeholder="400" />
          <Input label="Max Participants" type="number" value={form.max_participants} onChange={set("max_participants")} />
          <Input label="Registration Fee (PKR, 0=free)" type="number" value={form.registration_fee} onChange={set("registration_fee")} />
        </div>
        <Textarea label="Description" value={form.description} onChange={set("description")} placeholder="Describe the hike..." rows={4} />
        <div>
          <label className="block text-sm font-medium text-[#171B19] mb-1.5">Status</label>
          <Select value={form.status} onValueChange={setSelect("status")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft (hidden)</SelectItem>
              <SelectItem value="upcoming">Upcoming (Published)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-display font-semibold text-[#171B19]">Safety & Equipment</h2>
        <Textarea
          label="Required Equipment (comma-separated)"
          value={form.required_equipment}
          onChange={set("required_equipment")}
          placeholder="Trekking shoes, Water bottle, Sunscreen, First aid kit"
          rows={2}
        />
        <Textarea label="Safety Instructions" value={form.safety_instructions} onChange={set("safety_instructions")} rows={3} />
        <Textarea label="Cancellation Policy" value={form.cancellation_policy} onChange={set("cancellation_policy")} rows={2} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-display font-semibold text-[#171B19]">Organizer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Organizer Name" value={form.organizer_name} onChange={set("organizer_name")} />
          <Input label="Organizer Contact" value={form.organizer_contact} onChange={set("organizer_contact")} placeholder="+92..." />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg">
        <Save className="w-4 h-4" />
        {saving ? "Creating..." : "Create Hike Event"}
      </Button>
    </div>
  )
}
