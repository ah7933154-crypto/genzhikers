"use client"
import React, { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ExternalLink, User, Star, MapPin, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MEMBER_PHOTOS } from "@/lib/media"

interface Authority {
  id: string; name: string; designation: string
  department: string | null; city: string | null; bio: string | null
  photo_url: string | null; instagram_handle: string | null
  is_founding_member: boolean; sort_order: number
}

function LeaderCard({ authority, index }: { authority: Authority; index: number }) {
  const photoSrc = MEMBER_PHOTOS[authority.name] || authority.photo_url || null
  const initials = authority.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="bg-white rounded-3xl overflow-hidden border border-[#173D35]/10 hover:border-[#173D35]/30 hover:shadow-2xl transition-all duration-400 hover:-translate-y-1.5">

        {/* ── Photo area — taller, object-top so faces always show ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2820] to-[#173D35]"
             style={{ aspectRatio: "4/5" }}>

          {photoSrc ? (
            <Image
              src={photoSrc}
              alt={authority.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-top group-hover:scale-104 transition-transform duration-700"
              style={{ objectPosition: "center top" }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#A4AA83]/20 border-2 border-[#A4AA83]/30 flex items-center justify-center">
                <span className="text-[#A4AA83] font-bold text-2xl">{initials}</span>
              </div>
              <User className="w-6 h-6 text-white/20" />
            </div>
          )}

          {/* Gradient overlay — stronger at bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Founding badge — top-left */}
          {authority.is_founding_member && (
            <div className="absolute top-3 left-3 z-10">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-[#A4AA83] rounded-full text-[9px] font-bold text-[#0f2820] uppercase tracking-wider shadow-md">
                <Star className="w-2.5 h-2.5" fill="currentColor" />
                Founding
              </div>
            </div>
          )}

          {/* Name + designation overlaid on photo bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <h3 className="font-display font-bold text-white text-base leading-tight drop-shadow-lg">
              {authority.name}
            </h3>
            <p className="text-[#A4AA83] text-xs font-semibold mt-0.5 drop-shadow">
              {authority.designation}
            </p>
          </div>
        </div>

        {/* ── Info panel below photo ── */}
        <div className="p-4 space-y-2.5">

          {/* Department + city */}
          <div className="flex flex-wrap gap-2">
            {authority.department && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#173D35] bg-[#173D35]/8 px-2 py-0.5 rounded-full">
                <Building2 className="w-2.5 h-2.5" />
                {authority.department}
              </span>
            )}
            {authority.city && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#9c9c8f] bg-gray-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {authority.city}
              </span>
            )}
          </div>

          {/* Bio */}
          {authority.bio && (
            <p className="text-xs text-[#6b6b5e] leading-relaxed line-clamp-3">
              {authority.bio}
            </p>
          )}

          {/* Instagram */}
          {authority.instagram_handle && (
            <a
              href={`https://instagram.com/${authority.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#173D35] hover:text-[#1e5045] font-medium transition-colors group/ig"
            >
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center group-hover/ig:scale-110 transition-transform">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </span>
              @{authority.instagram_handle}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function LeadershipSection() {
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("authorities")
        .select("id,name,designation,department,city,bio,photo_url,instagram_handle,is_founding_member,sort_order")
        .eq("is_active", true)
        .order("sort_order")
      setAuthorities(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section id="leadership" className="section-padding bg-[#F5F4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block"
          >
            The Team
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-display font-bold text-4xl sm:text-5xl text-[#171B19] leading-tight mb-4"
          >
            Leadership &
            <span className="text-[#173D35]"> Authorities</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-[#6b6b5e] text-base leading-relaxed"
          >
            The passionate individuals who guide, grow, and protect the GenZ Hikers community.
          </motion.p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="rounded-3xl bg-white animate-pulse" style={{ aspectRatio: "4/5" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {authorities.map((auth, i) => (
              <LeaderCard key={auth.id} authority={auth} index={i} />
            ))}
          </div>
        )}

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 p-6 bg-white rounded-2xl border border-[#173D35]/10 text-center shadow-sm"
        >
          <p className="text-sm text-[#6b6b5e]">
            GenZ Hikers is led by our dedicated founding team and growing community of senior members.
            More positions and members will be added as the community grows.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
