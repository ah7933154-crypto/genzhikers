"use client"
import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar, Clock, MapPin, Users, Mountain, ChevronRight,
  Banknote, Shield, Package, AlertTriangle, ArrowLeft, CheckCircle, XCircle
} from "lucide-react"
import { formatDate, formatTime } from "@/lib/utils"
import toast from "react-hot-toast"

interface HikeEvent {
  id: string; title: string; slug: string; description: string | null
  destination: string; starting_point: string; meeting_time: string
  estimated_return_time: string | null; event_date: string
  difficulty: string; distance_km: number | null; elevation_gain_m: number | null
  max_participants: number; registered_count: number; registration_fee: number
  status: string; cover_image_url: string | null; required_equipment: string[] | null
  safety_instructions: string | null; organizer_name: string | null
  organizer_contact: string | null; cancellation_policy: string | null
  notes: string | null
}

const difficultyColor: Record<string, string> = {
  easy: "easy", moderate: "moderate", difficult: "difficult", extreme: "extreme"
}

export default function HikeDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [hike, setHike] = useState<HikeEvent | null>(null)
  const [myReg, setMyReg] = useState<{ id: string; status: string } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
      const { data: hikeData } = await supabase
        .from("hike_events")
        .select("*")
        .eq("slug", slug)
        .single()
      setHike(hikeData)

      if (user && hikeData) {
        const { data: reg } = await supabase
          .from("event_registrations")
          .select("id,status")
          .eq("event_id", hikeData.id)
          .eq("user_id", user.id)
          .single()
        setMyReg(reg)
      }
      setLoading(false)
    }
    if (slug) load()
  }, [slug])

  const register = async () => {
    if (!userId) { router.push("/auth/login"); return }
    if (!hike) return
    setRegistering(true)
    const fee = hike.registration_fee
    const { error } = await supabase.from("event_registrations").insert({
      event_id: hike.id,
      user_id: userId,
      payment_status: fee === 0 ? "not_required" : "pending",
      payment_amount: fee > 0 ? fee : null,
    })
    if (error) {
      if (error.code === "23505") toast.error("You are already registered")
      else toast.error("Registration failed: " + error.message)
    } else {
      toast.success("Registered successfully!")
      setMyReg({ id: "new", status: "pending" })
      setHike((h) => h ? { ...h, registered_count: h.registered_count + 1 } : h)
    }
    setRegistering(false)
  }

  const cancelRegistration = async () => {
    if (!myReg || myReg.id === "new") return
    if (!confirm("Cancel your registration for this hike?")) return
    setRegistering(true)
    const { error } = await supabase.from("event_registrations").update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    }).eq("id", myReg.id)
    if (error) toast.error("Failed to cancel")
    else {
      toast.success("Registration cancelled")
      setMyReg({ ...myReg, status: "cancelled" })
      setHike((h) => h ? { ...h, registered_count: Math.max(0, h.registered_count - 1) } : h)
    }
    setRegistering(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F5F4EF] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#173D35] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!hike) return (
    <div className="min-h-screen bg-[#F5F4EF] flex flex-col items-center justify-center gap-4">
      <Mountain className="w-12 h-12 text-[#A4AA83]" />
      <p className="text-[#6b6b5e]">Hike not found.</p>
      <Link href="/#hikes" className="text-[#173D35] hover:underline text-sm">Back to Hikes</Link>
    </div>
  )

  const spotsLeft = hike.max_participants - hike.registered_count
  const isFull = spotsLeft <= 0
  const isUpcoming = hike.status === "upcoming"
  const regStatus = myReg?.status
  const canRegister = isUpcoming && !isFull && !regStatus && userId
  const isRegistered = regStatus && regStatus !== "cancelled"

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#F5F4EF] pt-16">
        {/* Hero */}
        <div className="relative h-72 sm:h-96 bg-[#0f2a24]">
          {hike.cover_image_url ? (
            <Image src={hike.cover_image_url} alt={hike.title} fill className="object-cover opacity-70" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/20">
              <Mountain className="w-24 h-24" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a24]/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-5xl mx-auto">
            <Link href="/#hikes" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs mb-4 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              All Hikes
            </Link>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant={difficultyColor[hike.difficulty] as "easy"|"moderate"|"difficult"|"extreme"} className="capitalize">{hike.difficulty}</Badge>
              {hike.status !== "upcoming" && <Badge variant="secondary" className="capitalize">{hike.status}</Badge>}
            </div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">{hike.title}</h1>
            <p className="text-white/70 mt-1">{hike.destination}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {hike.description && (
                <div className="bg-white rounded-2xl border border-[#173D35]/10 p-6">
                  <h2 className="font-display font-semibold text-[#171B19] mb-3">About This Hike</h2>
                  <p className="text-[#6b6b5e] leading-relaxed">{hike.description}</p>
                </div>
              )}

              {hike.required_equipment && hike.required_equipment.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#173D35]/10 p-6">
                  <h2 className="font-display font-semibold text-[#171B19] mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#173D35]" />
                    Required Equipment
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hike.required_equipment.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-[#6b6b5e]">
                        <ChevronRight className="w-3.5 h-3.5 text-[#A4AA83] flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hike.safety_instructions && (
                <div className="bg-white rounded-2xl border border-[#173D35]/10 p-6">
                  <h2 className="font-display font-semibold text-[#171B19] mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#173D35]" />
                    Safety Instructions
                  </h2>
                  <p className="text-[#6b6b5e] leading-relaxed text-sm">{hike.safety_instructions}</p>
                </div>
              )}

              {hike.cancellation_policy && (
                <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                  <h3 className="font-semibold text-amber-800 text-sm mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Cancellation Policy
                  </h3>
                  <p className="text-amber-700 text-xs leading-relaxed">{hike.cancellation_policy}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Registration card */}
              <div className="bg-white rounded-2xl border border-[#173D35]/10 p-5 sticky top-20">
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-2.5 text-sm text-[#6b6b5e]">
                    <Calendar className="w-4 h-4 text-[#173D35] flex-shrink-0" />
                    <span>{formatDate(hike.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-[#6b6b5e]">
                    <Clock className="w-4 h-4 text-[#173D35] flex-shrink-0" />
                    <span>Depart {formatTime(hike.meeting_time)}
                      {hike.estimated_return_time && ` · Return ${formatTime(hike.estimated_return_time)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-[#6b6b5e]">
                    <MapPin className="w-4 h-4 text-[#173D35] flex-shrink-0" />
                    <span>{hike.starting_point}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-[#6b6b5e]">
                    <Users className="w-4 h-4 text-[#173D35] flex-shrink-0" />
                    <span>{isFull ? "Fully booked" : `${spotsLeft} of ${hike.max_participants} spots left`}</span>
                  </div>
                  {hike.distance_km && (
                    <div className="flex items-center gap-2.5 text-sm text-[#6b6b5e]">
                      <Mountain className="w-4 h-4 text-[#173D35] flex-shrink-0" />
                      <span>{hike.distance_km} km{hike.elevation_gain_m ? ` · +${hike.elevation_gain_m}m` : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm">
                    <Banknote className="w-4 h-4 text-[#173D35] flex-shrink-0" />
                    <span className="font-semibold text-[#171B19]">
                      {hike.registration_fee === 0 ? "Free" : `PKR ${hike.registration_fee}`}
                    </span>
                  </div>
                </div>

                {isRegistered ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200 text-sm font-medium text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      Registered ({regStatus})
                    </div>
                    {regStatus !== "attended" && (
                      <button
                        onClick={cancelRegistration}
                        disabled={registering}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Registration
                      </button>
                    )}
                  </div>
                ) : canRegister ? (
                  <Button onClick={register} disabled={registering} className="w-full" size="lg">
                    {registering ? "Registering..." : "Register for This Hike"}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : !userId ? (
                  <Button asChild className="w-full" size="lg">
                    <Link href="/auth/login">Sign In to Register</Link>
                  </Button>
                ) : isFull ? (
                  <Button disabled className="w-full" variant="outline">Fully Booked</Button>
                ) : !isUpcoming ? (
                  <Button disabled className="w-full capitalize" variant="outline">{hike.status}</Button>
                ) : regStatus === "cancelled" ? (
                  <Button onClick={register} disabled={registering} className="w-full">
                    Re-register
                  </Button>
                ) : null}
              </div>

              {/* Organizer */}
              {hike.organizer_name && (
                <div className="bg-white rounded-2xl border border-[#173D35]/10 p-5">
                  <h3 className="font-semibold text-[#171B19] text-sm mb-2">Organizer</h3>
                  <p className="text-sm text-[#6b6b5e]">{hike.organizer_name}</p>
                  {hike.organizer_contact && (
                    <a href={`tel:${hike.organizer_contact}`} className="text-xs text-[#173D35] hover:underline mt-0.5 block">
                      {hike.organizer_contact}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
