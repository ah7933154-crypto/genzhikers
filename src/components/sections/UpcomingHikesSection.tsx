"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Calendar, Clock, MapPin, Users, ChevronRight, Mountain, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime } from "@/lib/utils"

interface HikeEvent {
  id: string
  title: string
  slug: string
  destination: string
  starting_point: string
  meeting_time: string
  event_date: string
  difficulty: string
  distance_km: number | null
  max_participants: number
  registered_count: number
  registration_fee: number
  status: string
  cover_image_url: string | null
  organizer_name: string | null
}

function HikeCard({ hike, delay }: { hike: HikeEvent; delay: number }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const spotsLeft = hike.max_participants - hike.registered_count
  const isFull = spotsLeft <= 0

  const diffColors: Record<string, string> = {
    easy: "success",
    moderate: "warning",
    difficult: "destructive",
    extreme: "destructive",
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group bg-white rounded-2xl overflow-hidden border border-[#173D35]/10 hover:border-[#173D35]/25 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-[#173D35] to-[#0f2a24] overflow-hidden">
        {hike.cover_image_url ? (
          <Image
            src={hike.cover_image_url}
            alt={hike.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30">
            <Mountain className="w-12 h-12 mb-2" />
            <span className="text-sm">No photo yet</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={diffColors[hike.difficulty] as "success" | "warning" | "destructive"} className="capitalize text-xs">
            {hike.difficulty}
          </Badge>
          {hike.status === "upcoming" && !isFull && (
            <Badge variant="default" className="bg-[#173D35] text-white text-xs">
              Open
            </Badge>
          )}
          {isFull && (
            <Badge variant="secondary" className="text-xs">Full</Badge>
          )}
        </div>

        {/* Fee */}
        <div className="absolute top-3 right-3">
          <span className="text-xs font-semibold text-white bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            {hike.registration_fee === 0 ? "Free" : `PKR ${hike.registration_fee}`}
          </span>
        </div>

        {/* Date overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-white">
            <div className="font-display font-bold text-base leading-tight">{hike.destination}</div>
            <div className="text-white/70 text-xs">{formatDate(hike.event_date)}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-[#171B19] text-base mb-3 line-clamp-1">
          {hike.title}
        </h3>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-[#6b6b5e]">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(hike.event_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6b6b5e]">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Depart at {formatTime(hike.meeting_time)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6b6b5e]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{hike.starting_point}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6b6b5e]">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{isFull ? "Fully booked" : `${spotsLeft} spots left`}</span>
          </div>
        </div>

        <Link href={`/hikes/${hike.slug}`}>
          <Button
            size="sm"
            variant={isFull ? "outline" : "default"}
            className="w-full text-xs"
            disabled={isFull}
          >
            {isFull ? "View Details" : "Register Now"}
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}

export default function UpcomingHikesSection() {
  const [hikes, setHikes] = useState<HikeEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [ref, inView] = useInView({ triggerOnce: true })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("hike_events")
        .select("id,title,slug,destination,starting_point,meeting_time,event_date,difficulty,distance_km,max_participants,registered_count,registration_fee,status,cover_image_url,organizer_name")
        .eq("status", "upcoming")
        .order("event_date", { ascending: true })
        .limit(6)
      setHikes(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section id="hikes" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <motion.span
              ref={ref}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block"
            >
              Every Sunday
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="font-display font-bold text-4xl sm:text-5xl text-[#171B19] leading-tight"
            >
              Upcoming
              <span className="text-[#173D35]"> Hikes</span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button asChild variant="outline" size="sm">
              <Link href="/hikes">
                <Zap className="w-3.5 h-3.5" />
                View All Hikes
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-[#173D35]/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : hikes.length === 0 ? (
          <div className="text-center py-16">
            <Mountain className="w-10 h-10 text-[#A4AA83] mx-auto mb-3" />
            <p className="text-[#6b6b5e] text-base">No upcoming hikes yet. Check back soon.</p>
            <p className="text-xs text-[#9c9c8f] mt-1">Follow our Instagram for the latest updates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hikes.map((hike, i) => (
              <HikeCard key={hike.id} hike={hike} delay={i * 0.1} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
